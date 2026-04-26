import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import readline from "readline";
import fs from "fs";
import path from "path";
import {
  saveUserTweets,
  getUserTweets,
  getTopViral,
  listUsers,
  TweetRecord,
} from "../db";

const router = Router();

const DB_DIR = path.join(process.cwd(), "database");
const PYTHON_BIN = process.platform === "win32" ? "python" : "python3";
const SCRAPER_SCRIPT = path.join(process.cwd(), "python", "scraper.py");

// ── In-memory scrape progress store ──────────────────────────────────────────

interface ScrapeProgress {
  username: string;
  status: "running" | "done" | "error";
  current_page: number;
  total_pages: number;
  oldest_date: string;
  total_fetched: number;
  message: string;
  updated_at: string;
}

const scrapeProgress: Map<string, ScrapeProgress> = new Map();

// ── POST /api/tweets/save ─────────────────────────────────────────────────────

router.post("/tweets/save", (req: Request, res: Response) => {
  const { username, display_name, tweets } = req.body as {
    username?: string;
    display_name?: string;
    tweets?: TweetRecord[];
  };

  if (!username || !Array.isArray(tweets)) {
    res.status(400).json({ error: "username and tweets[] are required" });
    return;
  }

  try {
    const result = saveUserTweets({ username, display_name: display_name ?? username, tweets });
    res.json(result);
  } catch (err) {
    console.error("[db] saveUserTweets error:", err);
    res.status(500).json({ error: "Failed to save tweets" });
  }
});

// ── GET /api/tweets/viral/top ─────────────────────────────────────────────────

router.get("/tweets/viral/top", (req: Request, res: Response) => {
  const { username, date_from, date_to, limit } = req.query as Record<string, string>;

  try {
    const tweets = getTopViral({
      username: username || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json(tweets);
  } catch (err) {
    console.error("[db] getTopViral error:", err);
    res.status(500).json({ error: "Failed to query viral tweets" });
  }
});

// ── GET /api/tweets/:username ─────────────────────────────────────────────────

router.get("/tweets/:username", (req: Request, res: Response) => {
  const { username } = req.params;
  const { date_from, date_to, limit, sort_by } = req.query as Record<string, string>;

  try {
    const tweets = getUserTweets(username, {
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      limit: limit ? parseInt(limit) : 50,
      sort_by: (sort_by as "views" | "likes" | "retweets" | "created_at") || "views",
    });
    res.json(tweets);
  } catch (err) {
    console.error("[db] getUserTweets error:", err);
    res.status(500).json({ error: "Failed to query tweets" });
  }
});

// ── GET /api/users ────────────────────────────────────────────────────────────

router.get("/users", (_req: Request, res: Response) => {
  try {
    res.json(listUsers());
  } catch (err) {
    console.error("[db] listUsers error:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// ── GET /api/export/:username ─────────────────────────────────────────────────

router.get("/export/:username", (req: Request, res: Response) => {
  const { username } = req.params;
  const fp = path.join(DB_DIR, `${username.toLowerCase()}.json`);

  if (!fs.existsSync(fp)) {
    res.status(404).json({ error: `No data found for @${username}` });
    return;
  }

  res.setHeader("Content-Disposition", `attachment; filename="${username.toLowerCase()}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.sendFile(fp);
});

// ── GET /api/scrape/progress/:username ───────────────────────────────────────

router.get("/scrape/progress/:username", (req: Request, res: Response) => {
  const { username } = req.params;
  const progress = scrapeProgress.get(username.toLowerCase());
  if (!progress) {
    res.status(404).json({ error: `No scrape progress found for @${username}` });
    return;
  }
  res.json(progress);
});

// ── GET /api/scrape/stream/:username (SSE) ────────────────────────────────────

router.get("/scrape/stream/:username", (req: Request, res: Response) => {
  const { username } = req.params;
  const key = username.toLowerCase();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const interval = setInterval(() => {
    const progress = scrapeProgress.get(key);
    if (!progress) {
      res.write(`data: ${JSON.stringify({ status: "not_found" })}\n\n`);
      return;
    }

    res.write(`data: ${JSON.stringify(progress)}\n\n`);

    if (progress.status === "done" || progress.status === "error") {
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on("close", () => clearInterval(interval));
});

// ── POST /api/scrape ──────────────────────────────────────────────────────────

router.post("/scrape", (req: Request, res: Response) => {
  const { username, pages = 10 } = req.body as { username?: string; pages?: number };

  if (!username || typeof username !== "string" || username.trim() === "") {
    res.status(400).json({ error: "username is required" });
    return;
  }

  const cleanUsername = username.trim().replace(/^@/, "");
  const key = cleanUsername.toLowerCase();
  const totalPages = Number(pages) || 10;

  scrapeProgress.set(key, {
    username: cleanUsername,
    status: "running",
    current_page: 0,
    total_pages: totalPages,
    oldest_date: "",
    total_fetched: 0,
    message: "Starting...",
    updated_at: new Date().toISOString(),
  });

  let child;
  try {
    child = spawn(PYTHON_BIN, [
      SCRAPER_SCRIPT,
      "--user", cleanUsername,
      "--pages", String(totalPages),
    ]);
  } catch (err) {
    scrapeProgress.set(key, {
      ...scrapeProgress.get(key)!,
      status: "error",
      message: "Failed to spawn Python process",
      updated_at: new Date().toISOString(),
    });
    res.status(500).json({ error: "Failed to spawn Python process" });
    return;
  }

  // Parse stdout line by line
  const rl = readline.createInterface({ input: child.stdout });

  rl.on("line", (line: string) => {
    process.stdout.write(`[scraper:${cleanUsername}] ${line}\n`);

    const current = scrapeProgress.get(key);
    if (!current) return;

    const update: Partial<ScrapeProgress> = { updated_at: new Date().toISOString() };

    // "Page 3/10 — fetched 20 tweets (oldest: 2024-06-01)"
    const pageMatch = line.match(/Page\s+(\d+)\/(\d+)/i);
    if (pageMatch) {
      update.current_page = parseInt(pageMatch[1]);
      update.total_pages  = parseInt(pageMatch[2]);
    }

    const oldestMatch = line.match(/oldest:\s*([\d-]+)/i);
    if (oldestMatch) {
      update.oldest_date = oldestMatch[1];
    }

    // "Total fetched: 187."
    const fetchedMatch = line.match(/Total fetched:\s*(\d+)/i);
    if (fetchedMatch) {
      update.total_fetched = parseInt(fetchedMatch[1]);
    }

    scrapeProgress.set(key, { ...current, ...update });
  });

  child.stderr.on("data", (data: Buffer) => {
    process.stderr.write(`[scraper:${cleanUsername}:err] ${data.toString()}`);
  });

  child.on("close", (code) => {
    console.log(`[scraper:${cleanUsername}] process exited with code ${code}`);
    const current = scrapeProgress.get(key);
    if (current) {
      scrapeProgress.set(key, {
        ...current,
        status: code === 0 ? "done" : "error",
        message: code === 0 ? "Completed" : "Failed",
        updated_at: new Date().toISOString(),
      });
    }
  });

  res.json({ message: `Scraping started for @${cleanUsername}` });
});

export default router;
