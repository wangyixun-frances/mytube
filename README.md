# MyTube

A minimal YouTube search page: a password screen, a search bar, and a plain-text list of results. Uses **YouTube Data API v3**.

## Features

**Password screen**
- The site opens on a password prompt. Search isn't available until you unlock it.
- The default password is `i confirm that i need to use youtube right now`. It isn't case-sensitive, and extra spaces are ignored.

**Search**
- Each result shows the channel, publish date, length (or "Live"), title and description.
- Long descriptions are cut to two lines. Click **Show full description** to expand one. Links in descriptions can be clicked.
- **YouTube Shorts are removed.** The API doesn't label Shorts, so any video up to 3 minutes long that is vertical or square, or tagged `#shorts`, is left out. Each search fetches 50 videos (for the same quota as 20) so there are still plenty left after filtering.
- **More results** at the bottom loads the next batch.
- **latest** sorts the loaded results from newest to oldest. Click it again for YouTube's original order. It stays on for new searches and "More results".
- **clear** empties the search box and the results and returns to the blank start page.
- Searches are saved in the address bar (`?q=...`), so the back button and bookmarks work.
- Press `/` anywhere to jump to the search bar.

**Player**
- Clicking a title plays the video in a pop-up player (privacy-enhanced youtube-nocookie.com embed).
- Cmd-click or Ctrl-click a title to open it on YouTube instead. Videos that can't be embedded always open on YouTube.
- Press Esc, click **Close**, or click outside the player to close it.


## Changing the password or unlock time

Both are in [`api/_auth.js`](api/_auth.js):

- `PASSWORD` is the default password. You can also override it with a `SITE_PASSWORD` variable, either in `.env` locally or on Vercel with
  `vercel env add SITE_PASSWORD --environment production`. Using the variable keeps the real password out of the code if this repo is ever public.
- `SESSION_SECONDS` is how long the site stays unlocked. It's currently `60 * 5`, which is 5 minutes.


## How it works

| File | What it does |
| --- | --- |
| `index.html` | The whole front end: lock screen, search bar, results, player. |
| `api/search.js` | Server function that calls the YouTube Data API. It refuses requests without a valid session. |
| `api/login.js` | Checks the password and sets a signed, HttpOnly session cookie. |
| `api/_auth.js` | Password and session logic. Files starting with `_` aren't exposed as Vercel functions. |
| `server.js` | Small local server for `npm start`. Vercel doesn't use it. |

The API key and the password stay on the server and are never sent to the browser.