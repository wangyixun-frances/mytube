// GET  /api/login → { authed: boolean }
// POST /api/login { password } → sets the session cookie if correct
import { checkPassword, isAuthed, sessionCookie } from './_auth.js';

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

export async function GET(request) {
  return json({ authed: isAuthed(request) });
}

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return json({ error: 'Wrong password.' }, 401);
  }
  return json({ authed: true }, 200, { 'Set-Cookie': sessionCookie(request) });
}
