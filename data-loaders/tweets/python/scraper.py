import asyncio
import argparse
import json
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from tqdm import tqdm
from twikit import Client, errors

CUTOFF_YEAR = 2022
API_SAVE_URL = "http://localhost:3000/api/tweets/save"
PAGE_DELAY_SECONDS = 2
COOKIES_FILE = Path(__file__).parent / "cookies.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape tweets from a Twitter/X user")
    parser.add_argument("--user", required=True, help="Twitter @handle (without @)")
    parser.add_argument(
        "--pages",
        type=int,
        default=10,
        help="Number of timeline pages to fetch (default: 10). Use 50+ to reach back to 2022.",
    )
    return parser.parse_args()


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def tweet_created_at_iso(tweet) -> str:
    try:
        dt = tweet.created_at_datetime
        if dt is None:
            return ""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return str(getattr(tweet, "created_at", ""))


def tweet_created_year(tweet) -> int:
    try:
        dt = tweet.created_at_datetime
        if dt is None:
            return 9999
        return dt.year
    except Exception:
        return 9999


def extract_tweet(tweet, username: str, display_name: str, scraped_at: str) -> dict:
    views = None
    raw_views = getattr(tweet, "view_count", None)
    if raw_views is not None:
        try:
            views = int(raw_views)
        except (ValueError, TypeError):
            views = None

    return {
        "id": str(tweet.id),
        "username": username.lower(),
        "display_name": display_name or username,
        "text": tweet.text or "",
        "views": views,
        "likes": int(tweet.favorite_count) if tweet.favorite_count else 0,
        "retweets": int(tweet.retweet_count) if tweet.retweet_count else 0,
        "replies": int(tweet.reply_count) if tweet.reply_count else 0,
        "bookmarks": int(tweet.bookmark_count) if tweet.bookmark_count else 0,
        "created_at": tweet_created_at_iso(tweet),
        "scraped_at": scraped_at,
    }


def post_to_api(username: str, display_name: str, tweets: list[dict]) -> None:
    payload = json.dumps(
        {"username": username, "display_name": display_name, "tweets": tweets}
    ).encode("utf-8")

    req = urllib.request.Request(
        API_SAVE_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            print(
                f"API save → inserted: {body.get('inserted', '?')}, "
                f"skipped: {body.get('skipped', '?')}, "
                f"total: {body.get('total', '?')}"
            )
    except urllib.error.URLError as e:
        print(f"WARNING: Could not reach API at {API_SAVE_URL}: {e}", file=sys.stderr)
    except Exception as e:
        print(f"WARNING: API save failed: {e}", file=sys.stderr)


async def get_client() -> Client:
    client = Client('en-US')

    if COOKIES_FILE.exists():
        print("Loading saved session (cookies.json)...")
        client.load_cookies(str(COOKIES_FILE))
        return client

    username_env = os.getenv("TWITTER_USERNAME")
    email_env = os.getenv("TWITTER_EMAIL")
    password_env = os.getenv("TWITTER_PASSWORD")

    if not all([username_env, email_env, password_env]):
        print("ERROR: credentials not found in .env", file=sys.stderr)
        sys.exit(1)

    print("First time login — using credentials from .env...")
    await client.login(
        auth_info_1=username_env,
        auth_info_2=email_env,
        password=password_env,
    )
    client.save_cookies(str(COOKIES_FILE))
    print("Login successful. Session saved to cookies.json for future runs.")
    return client

async def main() -> None:
    load_dotenv()
    args = parse_args()
    username = args.user.lstrip("@")
    max_pages = args.pages
    scraped_at = now_iso()

    print(f"Starting scraper for @{username} …")
    client = await get_client()

    try:
        user = await client.get_user_by_screen_name(username)
    except errors.UserNotFound:
        print(f"ERROR: User @{username} not found", file=sys.stderr)
        sys.exit(1)
    except errors.TwitterException as e:
        print(f"ERROR: Failed to fetch user — {e}", file=sys.stderr)
        sys.exit(1)

    display_name: str = getattr(user, "name", "") or username

    print(f"Found user: {display_name} (@{username})")
    print(f"Fetching up to {max_pages} pages …\n")

    all_tweets: list[dict] = []
    page_num = 0
    stop_reason = "reached page limit"

    try:
        timeline = await user.get_tweets("Tweets")
    except errors.TooManyRequests:
        print("ERROR: Rate limit hit on first request. Please wait and retry.", file=sys.stderr)
        sys.exit(1)
    except errors.TwitterException as e:
        print(f"ERROR: Failed to fetch timeline — {e}", file=sys.stderr)
        sys.exit(1)

    pbar = tqdm(
        total=max_pages,
        desc=f"@{username}",
        unit="page",
        bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} pages | oldest: {postfix}",
    )

    while timeline and page_num < max_pages:
        page_num += 1
        page_tweets: list[dict] = []
        oldest_date = ""
        hit_cutoff = False

        for tweet in timeline:
            year = tweet_created_year(tweet)
            if year < CUTOFF_YEAR:
                hit_cutoff = True
                break
            td = extract_tweet(tweet, username, display_name, scraped_at)
            page_tweets.append(td)
            if not oldest_date or td["created_at"] < oldest_date:
                oldest_date = td["created_at"]

        all_tweets.extend(page_tweets)
        oldest_display = oldest_date[:10] if oldest_date else "unknown"
        print(f"Page {page_num}/{max_pages} — fetched {len(page_tweets)} tweets (oldest: {oldest_display})", flush=True)
        pbar.set_postfix_str(oldest_display)
        pbar.update(1)

        if hit_cutoff:
            stop_reason = f"reached cutoff year {CUTOFF_YEAR}"
            break

        if page_num >= max_pages:
            break

        try:
            time.sleep(PAGE_DELAY_SECONDS)
            timeline = await timeline.next()
        except errors.TooManyRequests:
            print("WARNING: Rate limit reached during pagination. Stopping.", file=sys.stderr)
            stop_reason = "rate limit"
            break
        except StopIteration:
            stop_reason = "no more pages"
            break
        except errors.TwitterException as e:
            print(f"WARNING: Pagination error — {e}", file=sys.stderr)
            stop_reason = "pagination error"
            break

    pbar.close()

    total_fetched = len(all_tweets)
    print(f"\nDone. Reason: {stop_reason}. Total fetched: {total_fetched}.")

    if not all_tweets:
        print("No tweets to save.")
        return

    post_to_api(username, display_name, all_tweets)


if __name__ == "__main__":
    asyncio.run(main())
