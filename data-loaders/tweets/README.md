# Tweet Scraper Dashboard

Twitter/X + Truth Social scraper with a local Express dashboard.

## Stack

- **Python 3.11** + [twikit 2.3.3](https://github.com/d60/twikit) — Twitter/X scraping
- **Node.js** + **TypeScript** + **Express** — REST API + web UI
- **Storage** — one JSON file per user in `database/`

---

## Setup

### 1. Python dependencies

```bash
pip install -r python/requirements.txt
```

### 2. Apply required twikit patches

After installation, two files inside the `twikit` package must be patched manually.

#### Patch A — `twikit/x_client_transaction/transaction.py`

Find the `get_indices` method. Locate this line:

```python
raise Exception("Couldn't get KEY_BYTE indices")
```

Replace the whole guard block with:

```python
if not key_byte_indices:
    return 0, [0]
raise Exception("Couldn't get KEY_BYTE indices")
```

#### Patch B — `twikit/user.py`

In the `__init__` method, replace **all** direct dict accesses that can raise `KeyError`
with `.get(key, default)` calls. Known fields that need patching:

| Original                                          | Patched                                                              |
|---------------------------------------------------|----------------------------------------------------------------------|
| `legacy['withheld_in_countries']`                 | `legacy.get('withheld_in_countries', [])`                            |
| `legacy['entities']['description']['urls']`       | `legacy.get('entities', {}).get('description', {}).get('urls', [])` |
| `legacy['pinned_tweet_ids_str']`                  | `legacy.get('pinned_tweet_ids_str', [])`                             |

Use the correct default type:
- list fields → `[]`
- str fields → `''`
- bool fields → `False`
- int fields → `0`
- other → `None`

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your credentials
```

### 4. Export cookies from the browser

1. Log in to **x.com** in your browser.
2. Install the [Cookie-Editor](https://cookie-editor.com/) extension.
3. Export cookies as JSON → save as `python/cookies.json`.
4. Convert to the dict format twikit expects:

```bash
cd python
python -c "import json; c=json.load(open('cookies.json')); json.dump({x['name']:x['value'] for x in c}, open('cookies.json','w'))"
```

### 5. Install Node.js dependencies

```bash
npm install
```

---

## Running

### Start the API + UI server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scrape a Twitter/X user (CLI)

In a separate terminal:

```bash
cd python
python scraper.py --user elonmusk --pages 20
```

- `--user` — Twitter handle without `@`
- `--pages` — number of timeline pages to fetch (default `10`; use `50+` to reach 2022)

### Scrape Trump's Truth Social posts

```bash
cd python
python truth_social.py
```

Data is saved to `database/trump_truth.json`.

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scrape` | Start scraping `{ username, pages? }` |
| `GET` | `/api/scrape/progress/:username` | Poll scrape progress |
| `GET` | `/api/scrape/stream/:username` | SSE stream of scrape progress |
| `POST` | `/api/tweets/save` | Save tweets `{ username, display_name, tweets[] }` |
| `GET` | `/api/tweets/:username` | Browse user tweets (supports `date_from`, `date_to`, `limit`, `sort_by`) |
| `GET` | `/api/tweets/viral/top` | Top viral across all users (supports `username`, `date_from`, `date_to`, `limit`) |
| `GET` | `/api/users` | List tracked users |
| `GET` | `/api/export/:username` | Download raw JSON file |
| `GET` | `/api/health` | Health check |

---

## Project Structure

```
tweets/
├── python/
│   ├── scraper.py          ← Twitter/X scraper (async, twikit)
│   ├── truth_social.py     ← Truth Social scraper (CNN public archive)
│   └── requirements.txt
├── src/
│   ├── server.ts           ← Express entry point
│   ├── db.ts               ← JSON file storage layer
│   ├── routes/
│   │   └── tweets.ts       ← All API routes
│   └── public/
│       └── index.html      ← Single-page dashboard
├── database/               ← One .json per user (git-ignored)
├── output/                 ← Scratch space (git-ignored)
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```
