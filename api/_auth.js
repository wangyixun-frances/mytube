// Shared password check. Files starting with "_" are not exposed as Vercel functions.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// Case-insensitive; extra spaces are ignored. Override with the SITE_PASSWORD env var.
const PASSWORD = process.env.SITE_PASSWORD || 'i confirm that i need to use youtube right now';
const SESSION_SECONDS = 60 * 5; // stay unlocked for 5 mins
const COOKIE = 'mytube_session';

const normalize = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const digest = (s) => createHash('sha256').update('mytube:' + normalize(s)).digest();
const KEY = digest(PASSWORD);

export function checkPassword(input) {
  return timingSafeEqual(digest(input), KEY);
}

function sign(exp) {
  return createHmac('sha256', KEY).update(String(exp)).digest('hex');
}

export function sessionCookie(request) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function isAuthed(request) {
  const cookies = request.headers.get('cookie') || '';
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([0-9a-f]{64})`));
  if (!m) return false;
  const [, exp, sig] = m;
  if (+exp < Date.now() / 1000) return false;
  return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(sign(exp), 'hex'));
}
