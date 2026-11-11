// GET /api/search?q=...&pageToken=...
// Works as a Vercel function (Web-standard GET export) and via server.js locally.

import { isAuthed } from './_auth.js';

const API = 'https://www.googleapis.com/youtube/v3';

export async function GET(request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const pageToken = url.searchParams.get('pageToken') || '';
  const key = process.env.YOUTUBE_API_KEY;

  if (!isAuthed(request)) return json({ error: 'Locked.', locked: true }, 401);

  if (!key) return json({ error: 'Server is missing YOUTUBE_API_KEY.' }, 500);
  if (!q) return json({ error: 'Missing query.' }, 400);
  if (q.length > 200) return json({ error: 'Query too long.' }, 400);

  try {
    // 1) search.list — 100 quota units whatever maxResults is, so ask for the maximum (50).
    //    Shorts are filtered out below, which leaves fewer to show.
    const sp = new URLSearchParams({ part: 'snippet', type: 'video', maxResults: '50', q, key });
    if (pageToken) sp.set('pageToken', pageToken);
    const search = await yt('search', sp);
    const ids = (search.items || []).map((i) => i.id?.videoId).filter(Boolean);

    // 2) videos.list — 1 unit. Full descriptions, duration, embeddability, and player size (for spotting Shorts).
    const details = new Map();
    if (ids.length) {
      const vp = new URLSearchParams({ part: 'snippet,contentDetails,status,player', id: ids.join(','), maxHeight: '720', key });
      const videos = await yt('videos', vp);
      for (const v of videos.items || []) details.set(v.id, v);
    }

    const results = ids
      .filter((id) => details.has(id) && !isShort(details.get(id)))
      .map((id) => {
        const v = details.get(id);
        return {
          id,
          title: v.snippet.title,
          channel: v.snippet.channelTitle,
          publishedAt: v.snippet.publishedAt,
          description: v.snippet.description || '',
          duration: v.contentDetails?.duration || null,
          live: v.snippet.liveBroadcastContent !== 'none',
          embeddable: v.status?.embeddable !== false,
        };
      });

    return json(
      { results, nextPageToken: search.nextPageToken || null },
      200,
      // Cache identical queries in your browser for an hour to save quota.
      // (Not a shared edge cache, which would serve results without checking the password.)
      { 'Cache-Control': 'private, max-age=3600' }
    );
  } catch (err) {
    return json({ error: err.message }, 502);
  }
}

// The API has no "is a Short" flag. Shorts are vertical or square and at most 3 minutes long,
// so drop anything that fits that, plus anything up to 3 minutes tagged #shorts.
function isShort(v) {
  const secs = seconds(v.contentDetails?.duration);
  if (!secs || secs > 180) return false; // 0 or unknown = live stream or upcoming, keep it
  const w = Number(v.player?.embedWidth), h = Number(v.player?.embedHeight);
  const vertical = w > 0 && h > 0 && w <= h;
  const tagged = /#shorts?\b/i.test(`${v.snippet.title} ${v.snippet.description}`);
  return vertical || tagged;
}

function seconds(iso) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso || '');
  if (!m) return null;
  const [, d = 0, h = 0, min = 0, s = 0] = m;
  return +d * 86400 + +h * 3600 + +min * 60 + +s;
}

async function yt(endpoint, params) {
  const r = await fetch(`${API}/${endpoint}?${params}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || `YouTube API error ${r.status}`);
  return data;
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}
