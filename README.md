# Commute Tracker (web version) — setup guide

This is a self-contained website. No Xcode, no Apple Developer account, nothing that
expires after 7 days. Three steps: get a free TomTom key, put these files somewhere on
the web, then add it to your Home Screen from Safari.

## Step 1 — Get a free TomTom API key (2 minutes)

1. Go to **developer.tomtom.com** and click **Get a free API key** / **Register**.
2. Sign up with just an email — no credit card.
3. Once logged in, go to your **Dashboard** → create an app (any name, e.g. "Commute") →
   it'll generate an **API key**. Copy it.
4. You get a generous free daily quota — this app makes about 6 small requests per
   calculation (3 geocode + 2 route + 1 weather), so even calculating twice a day, every
   day, stays nowhere near the limit.

## Step 2 — Put the files online (pick ONE option)

You need the files served over **https://** for "Add to Home Screen" to work properly.
Opening the HTML file directly from your Files app won't behave the same way.

### Option A — GitHub Pages (permanent, recommended)

1. Go to **github.com**, sign up for a free account if you don't have one.
2. Click the **+** in the top right → **New repository**. Name it e.g. `commute-tracker`.
   Keep it Public. Create it.
3. Click **Add file → Upload files**, then drag in every file from this folder
   (`index.html`, `app.js`, `manifest.json`, `sw.js`, and the `icons` folder with its 3
   images). Commit the changes.
4. Go to the repo's **Settings → Pages**. Under "Build and deployment", set
   **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**. Save.
5. Wait about a minute, then refresh — GitHub shows your live URL, something like:
   `https://yourusername.github.io/commute-tracker/`

That URL is permanent and free for as long as you want it.

### Option B — Netlify Drop (fastest, good for testing)

1. Go to **app.netlify.com/drop**.
2. Drag the whole project folder onto the page. It deploys instantly and gives you a URL.
3. This works immediately, but the site is temporary unless you create a free Netlify
   account and "claim" it — worth doing if you like this option, otherwise switch to
   GitHub Pages for something permanent.

## Step 3 — Add it to your Home Screen

1. On your iPhone, open **Safari** (must be Safari, not Chrome — only Safari can install
   home screen apps on iOS) and go to the URL from Step 2.
2. Tap the **Share** icon (square with an arrow) in the toolbar.
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name ("Commute" is pre-filled) and tap **Add**.

You now have an app icon on your Home Screen. Opening it launches full-screen, no Safari
address bar — it behaves like a normal app, and it never expires or needs reinstalling.

## Step 4 — First-time setup inside the app

1. Open the app, tap the **gear icon**.
2. Paste your **TomTom API key**.
3. Check the three addresses (Home, WR9 0BA, Safran). For the Safran car park, consider
   pinning an exact coordinate: open Apple Maps, long-press the car park entrance on
   Hatherley Lane to drop a pin, copy its coordinates, and paste them in under
   "Use exact coordinates instead."
4. Tap **Save Settings**.
5. Go back, tap **Calculate New Commute**, then **Calculate Now** to test it.

## Managing your data

- **Delete a single entry:** in **View Captured Data → Table**, tap the ✕ on any card.
- **Delete everything:** same screen, **Reset All Data** button at the bottom (asks you
  to confirm first — export a CSV beforehand if you want a backup).
- **Spreadsheet view:** a third tab, **Sheet**, shows every run as a proper gridded table
  (date, time, day, period, route, from/to, minutes, miles, temperature, weather,
  season) — scroll sideways on narrow screens to see every column.
- **Rename your addresses:** in Settings, each address now has its own **Display name**
  field — what shows in the charts, table, and overview (e.g. "Evesham" instead of
  "Home"). The address/coordinates underneath are unaffected; this only changes the label.

## Automatic backups

There are two backup options, in Settings:

- **GitHub (automatic, no taps needed):** create a free **fine-grained personal access
  token** at github.com/settings/tokens → scope it to just one repo → give it
  **Contents: Read and write** permission and nothing else. Paste the token, your GitHub
  username, and a repo name into Settings, turn on **"Back up automatically after each
  calculation,"** and every time you calculate a commute, a JSON copy of all your data is
  pushed to a file in that repo. You can also tap **Backup Now** any time for a manual
  backup. This can be the same repo hosting the app, or a separate private one.

  With this turned on, the app also **pulls the latest backup down and merges it in
  before every calculation** — so if you ever use the app from a second phone, or
  restore it after losing your data, you won't overwrite newer data with older data.
  It does the same merge-and-push cycle after you **delete a single entry** or **Reset
  All Data** from the Table tab, so the GitHub copy always reflects what's actually on
  your phone, in both directions.
- **iCloud (manual, two taps):** a website genuinely can't write into iCloud Drive on its
  own — Apple doesn't allow that, for good security reasons. The closest thing: tap
  **Export as CSV** on the Table tab. On iPhone this opens the native share sheet, and
  **Save to Files → iCloud Drive** is two taps from there.

If you'd rather not use either, your data still lives safely in this browser's local
storage — these are just extra safety nets.

## About your data

- Everything is stored **only in this browser, on this phone** (no server, no account,
  no sync). Nobody else can see it.
- Because it's an installed Home Screen app (not just a Safari tab), iOS treats its
  storage as persistent — it won't get cleared out for inactivity the way regular Safari
  browsing data sometimes does.
- There's still no cloud backup, so if you ever want a safety copy, open
  **View Captured Data → Table → Export as CSV** — it saves a spreadsheet-ready file you
  can open in Numbers, Excel, or Google Sheets.
- Uninstalling the Home Screen icon or clearing Safari website data for this site *will*
  delete the data, so export first if you're ever doing either.

## Updating the app later

If you want to tweak anything (colours, add a feature, change the morning/evening
cutoff), edit the files and re-upload them the same way (drag the changed file into your
GitHub repo, or drag the folder onto Netlify Drop again). Your Home Screen icon keeps
pointing at the same URL, so changes appear next time you open it — no reinstalling.
