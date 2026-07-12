# NLJR (Not Long; Just Read)

NLJR is a local-first daily feed curation reader and dashboard. It is designed to monitor content feeds (podcasts, newsletters, RSS feeds, YouTube channels, keyword monitors, and adhoc URL links), process and rank the new items, filter duplicates, and compile a structured daily reading digest.

---

## Key Features

1. **Today's NLJR (`#daily`)**:
   - A dedicated reading panel showcasing the top 3 highly recommended deep-reads of the day.
   - A quick-scan feed of other relevant new articles for fast triage.
   - Live **Refresh Feeds** action directly from the web client.

2. **NLJR Console (`#console`)**:
   - **Keyword Watches**: Set up search prompts and queries to scan across platforms.
   - **Subscriptions**: Add stable RSS feeds, newsletters, YouTube channels, and blogs.
   - **Adhoc Inbox**: Submit custom links, notes, and manual articles.
   - **Processing History (Ledger)**: Audit trail of deduplicated and processed links.

3. **NLJR Archives (`#archives`)**:
   - Look up and browse previous daily digests.
   - Fully formatted Markdown archive reader.

---

## Setup & Running

This project uses a single local Node.js server to run both the API backend and serve the client interface.

### 1. Start the Server
Run the following command from the project root:
```bash
node server.mjs
```

### 2. Access the Dashboard
Open the web app in your browser:
*   **Local URL**: [http://127.0.0.1:5177/NLJR](http://127.0.0.1:5177/NLJR)
*   **LAN URL**: `http://<your-lan-ip>:5177/NLJR` (allows reading from other devices on the same Wi-Fi)

*Note: If port `5177` is already in use, you can specify an alternate port via environment variables:*
```bash
PORT=5180 node server.mjs
```

---

## CLI Commands

You can also run daily update workflows and dry-runs directly via the command line:

*   **Syntax Check**: Validate Javascript client files:
    ```bash
    npm run check
    ```

*   **Live Feed Scan (Fetch and Process)**:
    ```bash
    node scripts/refresh_nljr.js
    ```

*   **Dry-run Scan**: View what would be parsed without committing database changes:
    ```bash
    node scripts/refresh_nljr.js --dry-run
    ```

---

## Environment Configuration

Data is stored in simple JSON database files. You can configure custom data directory locations by creating a `.env` file at the root of the project:

```env
OPS_DATA_DIR="C:/path/to/your/external/ops-data/nljr"
PORT=5177
```

Using `OPS_DATA_DIR` isolates real data storage from the Git repository code, preventing private sources or articles from being tracked in GitHub.
