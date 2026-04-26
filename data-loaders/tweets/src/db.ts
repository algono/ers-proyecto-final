import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "database");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TweetRecord {
  id: string;
  username: string;
  display_name: string;
  text: string;
  views: number | null;
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
  created_at: string;
  scraped_at: string;
}

export interface UserMeta {
  username: string;
  display_name: string;
  total_tweets: number;
  last_scraped: string;
}

interface UserFile {
  username: string;
  display_name: string;
  last_scraped: string;
  total_tweets: number;
  tweets: TweetRecord[];
}

export interface SaveResult {
  inserted: number;
  skipped: number;
  total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbPath(username: string): string {
  return path.join(DB_DIR, `${username.toLowerCase()}.json`);
}

function dbTmpPath(username: string): string {
  return path.join(DB_DIR, `${username.toLowerCase()}.tmp.json`);
}

function readUserFile(username: string): UserFile | null {
  const fp = dbPath(username);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as UserFile;
  } catch {
    return null;
  }
}

function atomicWrite(username: string, data: UserFile): void {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const tmp = dbTmpPath(username);
  const final = dbPath(username);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, final);
}

function nowISO(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function compareDesc(a: TweetRecord, b: TweetRecord, field: string): number {
  if (field === "views") {
    if (a.views === null && b.views === null) return 0;
    if (a.views === null) return 1;
    if (b.views === null) return -1;
    return b.views - a.views;
  }
  if (field === "likes") return b.likes - a.likes;
  if (field === "retweets") return b.retweets - a.retweets;
  if (field === "created_at") {
    return b.created_at.localeCompare(a.created_at);
  }
  return 0;
}

function filterByDate(tweets: TweetRecord[], date_from?: string, date_to?: string): TweetRecord[] {
  return tweets.filter((t) => {
    if (date_from && t.created_at < date_from) return false;
    if (date_to   && t.created_at > date_to + "T23:59:59Z") return false;
    return true;
  });
}

function allUserFiles(): string[] {
  if (!fs.existsSync(DB_DIR)) return [];
  return fs
    .readdirSync(DB_DIR)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".tmp.json"))
    .map((f) => path.join(DB_DIR, f));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function saveUserTweets(data: {
  username: string;
  display_name: string;
  tweets: TweetRecord[];
}): SaveResult {
  const existing = readUserFile(data.username);
  const existingIds = new Set(existing?.tweets.map((t) => t.id) ?? []);

  const newTweets = data.tweets.filter((t) => !existingIds.has(t.id));
  const merged = [...(existing?.tweets ?? []), ...newTweets];

  const file: UserFile = {
    username: data.username.toLowerCase(),
    display_name: data.display_name || data.username,
    last_scraped: nowISO(),
    total_tweets: merged.length,
    tweets: merged,
  };

  atomicWrite(data.username, file);

  return {
    inserted: newTweets.length,
    skipped: data.tweets.length - newTweets.length,
    total: merged.length,
  };
}

export function getUserTweets(
  username: string,
  filters: {
    date_from?: string;
    date_to?: string;
    limit?: number;
    sort_by?: "views" | "likes" | "retweets" | "created_at";
  } = {}
): TweetRecord[] {
  const file = readUserFile(username);
  if (!file) return [];

  const { date_from, date_to, limit = 50, sort_by = "views" } = filters;
  let tweets = filterByDate(file.tweets, date_from, date_to);
  tweets = [...tweets].sort((a, b) => compareDesc(a, b, sort_by));
  return tweets.slice(0, limit);
}

export function getTopViral(
  filters: {
    username?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
  } = {}
): TweetRecord[] {
  const { username, date_from, date_to, limit = 20 } = filters;

  let allTweets: TweetRecord[] = [];

  if (username) {
    const file = readUserFile(username);
    allTweets = file?.tweets ?? [];
  } else {
    for (const fp of allUserFiles()) {
      try {
        const file = JSON.parse(fs.readFileSync(fp, "utf-8")) as UserFile;
        allTweets.push(...file.tweets);
      } catch {
        // skip malformed files
      }
    }
  }

  let tweets = filterByDate(allTweets, date_from, date_to);
  tweets = [...tweets].sort((a, b) => compareDesc(a, b, "views"));
  return tweets.slice(0, limit);
}

export function listUsers(): UserMeta[] {
  return allUserFiles().flatMap((fp) => {
    try {
      const file = JSON.parse(fs.readFileSync(fp, "utf-8")) as UserFile;
      return [
        {
          username: file.username,
          display_name: file.display_name,
          total_tweets: file.total_tweets,
          last_scraped: file.last_scraped,
        },
      ];
    } catch {
      return [];
    }
  });
}
