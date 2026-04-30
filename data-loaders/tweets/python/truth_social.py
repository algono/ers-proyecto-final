import html
import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

CNN_URL = "https://ix.cnn.io/data/truth-social/truth_archive.json"
DB_DIR = Path(__file__).parent.parent / "database"
OUTPUT_FILE = DB_DIR / "trump_truth.json"
TMP_FILE = DB_DIR / "trump_truth.tmp.json"

USERNAME = "realDonaldTrump"
DISPLAY_NAME = "Donald J. Trump"
PLATFORM = "truth_social"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def strip_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()


def parse_created_at(raw: str) -> str:
    """Convert Truth Social/Mastodon ISO timestamp to Z-terminated ISO 8601."""
    if not raw:
        return ""
    try:
        raw_clean = re.sub(r"\.\d+Z$", "Z", raw)
        if raw_clean.endswith("Z"):
            return raw_clean
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return raw


def extract_media_urls(media_list) -> list:
    if not media_list or not isinstance(media_list, list):
        return []
    urls = []
    for item in media_list:
        if isinstance(item, dict):
            url = item.get("url") or item.get("preview_url") or item.get("remote_url")
            if url:
                urls.append(url)
    return urls


def download_archive() -> list:
    print(f"Downloading archive from {CNN_URL} …")
    req = urllib.request.Request(
        CNN_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; truth-scraper/1.0)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            if not isinstance(data, list):
                print("ERROR: Unexpected JSON structure (expected array)", file=sys.stderr)
                sys.exit(1)
            return data
    except urllib.error.URLError as e:
        print(f"ERROR: Could not reach CNN archive: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse JSON from CNN archive: {e}", file=sys.stderr)
        sys.exit(1)


def read_existing() -> dict:
    if not OUTPUT_FILE.exists():
        return {
            "username": USERNAME,
            "display_name": DISPLAY_NAME,
            "platform": PLATFORM,
            "last_scraped": "",
            "total_posts": 0,
            "tweets": [],
        }
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        print("WARNING: Existing database file is corrupted — starting fresh.")
        return {
            "username": USERNAME,
            "display_name": DISPLAY_NAME,
            "platform": PLATFORM,
            "last_scraped": "",
            "total_posts": 0,
            "tweets": [],
        }


def atomic_write(data: dict) -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    with open(TMP_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(TMP_FILE, OUTPUT_FILE)


def map_post(post: dict, scraped_at: str) -> dict:
    post_id = str(post.get("id", ""))
    url = post.get("url") or f"https://truthsocial.com/@{USERNAME}/{post_id}"
    return {
        "id": post_id,
        "username": USERNAME,
        "display_name": DISPLAY_NAME,
        "platform": PLATFORM,
        "text": strip_html(post.get("content", "")),
        "views": None,
        "likes": int(post.get("favourites_count") or 0),
        "retweets": int(post.get("reblogs_count") or 0),
        "replies": int(post.get("replies_count") or 0),
        "bookmarks": None,
        "created_at": parse_created_at(post.get("created_at", "")),
        "scraped_at": scraped_at,
        "url": url,
        "media": extract_media_urls(post.get("media_attachments") or post.get("media")),
    }


def main() -> None:
    scraped_at = now_iso()

    raw_posts = download_archive()
    print(f"Downloaded {len(raw_posts)} posts from CNN archive.")

    existing = read_existing()
    existing_ids: set[str] = {t["id"] for t in existing.get("tweets", [])}

    new_records = []
    skipped = 0

    for post in raw_posts:
        post_id = str(post.get("id", ""))
        if not post_id:
            continue
        if post_id in existing_ids:
            skipped += 1
            continue
        new_records.append(map_post(post, scraped_at))
        existing_ids.add(post_id)

    merged = existing.get("tweets", []) + new_records
    existing["tweets"] = merged
    existing["last_scraped"] = scraped_at
    existing["total_posts"] = len(merged)

    atomic_write(existing)

    print(
        f"New: {len(new_records)}, Skipped (duplicates): {skipped}. "
        f"Total in DB: {len(merged)}."
    )


if __name__ == "__main__":
    main()
