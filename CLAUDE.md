# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a single-file PWA (`milk-logger.html`) for logging daily milk production from two cows — Poppy and Aurora Rose. It runs entirely in the browser with no build step or dependencies to install.

## Architecture

Everything lives in `milk-logger.html`: inline CSS, inline JavaScript, and the HTML structure. There is no bundler, framework, or server.

**Data flow:**
1. User speaks into the browser via the Web Speech API (`SpeechRecognition`)
2. The transcript is sent to the Anthropic API (`claude-sonnet-4-6`) to parse into structured JSON (`milk` or `note` entry)
3. The parsed entry is shown in a confirmation UI before saving
4. The user can optionally tap **Edit** to correct any misheard values before saving
5. On confirm, a POST is sent to a Google Apps Script URL which writes to a Google Sheet

**Google Sheet column mapping** (hardcoded in `COL` constant):
- Poppy AM → col 11 (K), Poppy PM → col 12 (L)
- Aurora AM → col 14 (N), Aurora PM → col 15 (O)
- Shared notes → col 17 (Q)
- Row offset: Jan 1, 2026 = row 3 (`JAN1_ROW`), subsequent dates are calculated as day-of-year offset

**Authentication:** The Anthropic API key is entered by the user on first launch and stored in `localStorage` under `milk_logger_api_key`. The Apps Script URL is hardcoded and public (no auth).

**Notes behavior:** Notes append to the existing cell value using `; ` as a separator (via the `append` action on the Apps Script). Milk entries overwrite the cell.

## Key constants to be aware of

- `APPS_SCRIPT_URL` — the Google Apps Script deployment URL (hardcoded); points to the farm owner's Google Sheet
- `ANTHROPIC_URL` — `https://api.anthropic.com/v1/messages`
- `JAN1_ROW = 3` — the spreadsheet row for January 1, 2026; adjust if the sheet structure changes
- The year is hardcoded to 2026 in `dateToRow()` and in the Claude system prompt

## Google Apps Script

The Apps Script (attached to the Google Sheet) supports two actions via POST:

- `{action: 'write', row, col, value}` — overwrites a cell (used for milk kg entries)
- `{action: 'append', row, col, value, separator}` — appends to existing cell content separated by `; ` (used for notes)

The script runs as the sheet owner and is deployed with "Anyone" access. No API key or auth token is required to call it.

## Deployment

The app is hosted on GitHub Pages (public repo) at:
https://holysmokes99.github.io/milk-logger/milk-logger.html

Changes are deployed by committing to the `main` branch via GitHub Desktop and pushing. GitHub Pages updates within ~1 minute.

The repo must remain **public** for GitHub Pages to work on the free plan. The API key is safe to leave out of the file because it is entered by the user at runtime and stored in localStorage — it is never committed to the repo.

## Other files in repo

- `manifest.json` — PWA manifest for home screen installation
- `icon-180.png`, `icon-192.png`, `icon-512.png` — home screen icons cropped from a cow photo; do not modify unless explicitly asked
- `CLAUDE.md` — this file

## Conventions

- The footer at the bottom of the app displays the last edited date and time (e.g. "App last edited: June 25, 2026 3:00PM"). **Update it on every change.**
- The user will supply the current time when requesting changes, since Claude Code does not have access to a real-time clock.
- All prices and measurements are in Canadian context (kg for milk weight).
- The app is used primarily on iPhone via Safari, installed as a home screen PWA. Keep mobile usability in mind for any UI changes.

## No build or test commands

Open `milk-logger.html` directly in a browser to run the app. No server, build tool, or test suite exists.

## Important: Apps Script and Sheet structure are tightly coupled

The Apps Script validation whitelist and the `COL` constant in `milk-logger.html`
must always be kept in sync with the actual Google Sheet column layout.

If any of the following change, **both** the HTML file and the Apps Script
must be updated together:
- Column positions for Poppy AM/PM, Aurora AM/PM, or Notes
- The starting row for January 1 (`JAN1_ROW`)
- The valid row range (currently 3–368 for all of 2026)

Always remind the user to redeploy the Apps Script (Deploy → Manage deployments
→ edit → New version → Deploy) after any Apps Script changes.
