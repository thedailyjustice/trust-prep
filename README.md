# TRUST Prep (v1)

A classroom practice tool for Mr. Johnathan's 7th grade STEM class at Riverdale K-8 (Germantown, TN), Quarter 2.

**This is a separate classroom tool.** It is not TRUST, it is not made or endorsed by the FAA, and it is not an FAA product. It does not give out certificates. Every screen shows:

> This prepares you; the official certificate comes from an FAA-approved test administrator.

Students who finish everything see "Practice complete" and a plain link to the FAA's list of TRUST test administrators.

It is also separate from the SI Challenge entry (Fault Finder). It shares no code or content with it.

## What's inside
- 11 short lessons, each with a check you can fix until you reach 100%
- A 12-question mixed practice quiz (also fix-until-100%)
- Three games: Hover hold, Airspace path, Visual observer calls

All practice items are original. None are copied from TRUST. Every lesson line and item comes from Proof's FAA fact sheet (`../review/faa-facts.md`, checked 2026-10-18). `../review/sources.csv` maps each line and item to its fact-sheet entry and source URL.

## Privacy
- No logins, no accounts, no student info, no trackers, no analytics.
- No outside requests: system fonts only, and a Content-Security-Policy blocks network calls (`connect-src 'none'`).
- Progress is saved only in this browser (`localStorage`, key `trustprep-v1`). The optional nickname stays on the device too.
- The Progress page has a **Reset progress** button for shared Chromebooks.
- The only outside links are plain links to FAA pages and the U.S. Code. Nothing loads from them unless a student clicks.

## Run it
Static files, no build step. Open `index.html` through any static web server, for example:

    python3 -m http.server 8770

Then visit http://localhost:8770/. Tested at 1366x768 (Chromebook) and 390px (phone) widths.

## Keyboard
- Everything is reachable with Tab, Enter, and Space.
- Hover hold: Up and Down arrows (or W and S), Space to start, P to pause.
- Airspace path: arrow keys move around the map, Enter adds a square.
- Observer calls: keys 1-5 pick a call, and Enter goes to the next scene.
- Reduced-motion settings are respected.
