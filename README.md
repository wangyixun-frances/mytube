# MyTube

A minimal YouTube search page: a password screen, a search bar, and a plain-text list of results.
No thumbnails, recommendations, Shorts or comments.

## Features

**Password screen**
- The site opens on a password prompt. Search isn't available until you unlock it.
- The default password is `i confirm that i need to use youtube right now`. It isn't case-sensitive, and extra spaces are ignored.
- Once you unlock it, the site stays open for 5 minutes in that browser, then asks again. The next search after that brings the prompt back, and the search runs once you unlock.
- The password is checked on the server, so searches can't skip it by calling the API directly.

**Search**
- Each result shows the channel, publish date, length (or "Live"), title and description.
- Long descriptions are cut to two lines. Click **Show full description** to expand one. Links in descriptions can be clicked.
- **More results** at the bottom loads the next 20.
- **latest** sorts the loaded results from newest to oldest. Click it again for YouTube's original order. It stays on for new searches and "More results".
- **clear** empties the search box and the results and returns to the blank start page.
- Searches are saved in the address bar (`?q=...`), so the back button and bookmarks work.
- Press `/` anywhere to jump to the search bar.

**Player**
- Clicking a title plays the video in a pop-up player (privacy-enhanced youtube-nocookie.com embed).
- Cmd-click or Ctrl-click a title to open it on YouTube instead. Videos that can't be embedded always open on YouTube.
- Press Esc, click **Close**, or click outside the player to close it.

## Setup

### 1. Get a YouTube API key (about 5 minutes)

1. Go to https://console.cloud.google.com/ and create a project.
2. Go to **APIs & Services → Library**, find **YouTube Data API v3** and click **Enable**.
3. Go to **APIs & Services → Credentials**, click **Create credentials → API key**, and copy the key.
4. Optional but recommended: edit the key and, under **API restrictions**, allow only YouTube Data API v3.

Quota: the free tier gives 10,000 units a day. Each search, including each "More results", costs about 101 units, so you get roughly 100 searches a day.
Repeating a search within an hour is served from your browser's cache and costs nothing.

### 2. Run it locally

You need Node 18 or newer. There are no dependencies to install.

```sh
cd mytube                 # the project folder
cp .env.example .env      # then open .env and replace paste-your-key-here with your key
npm start                 # open http://localhost:3000
```

Restart `npm start` (Ctrl+C, then run it again) after editing `.env` or anything in `api/`.

### 3. Deploy to Vercel (free)

```sh
npm i -g vercel
vercel                                                     # first time: accept the default settings
vercel env add YOUTUBE_API_KEY --environment production    # choose Secret, then paste your key
vercel --prod
```

Your local `.env` isn't uploaded, so the key has to be added to Vercel separately, as above.

## Changing the password or unlock time

Both are in [`api/_auth.js`](api/_auth.js):

- `PASSWORD` is the default password. You can also override it with a `SITE_PASSWORD` variable, either in `.env` locally or on Vercel with
  `vercel env add SITE_PASSWORD --environment production`. Using the variable keeps the real password out of the code if this repo is ever public.
- `SESSION_SECONDS` is how long the site stays unlocked. It's currently `60 * 5`, which is 5 minutes.

Changing the password locks every browser that's currently unlocked.

## How it works

| File | What it does |
| --- | --- |
| `index.html` | The whole front end: lock screen, search bar, results, player. |
| `api/search.js` | Server function that calls the YouTube Data API. It refuses requests without a valid session. |
| `api/login.js` | Checks the password and sets a signed, HttpOnly session cookie. |
| `api/_auth.js` | Password and session logic. Files starting with `_` aren't exposed as Vercel functions. |
| `server.js` | Small local server for `npm start`. Vercel doesn't use it. |

The API key and the password stay on the server and are never sent to the browser.
