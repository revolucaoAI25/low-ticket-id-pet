import { ADMIN_COOKIE, checkPassword } from '@/lib/server/admin';
import { json } from '@/lib/server/util';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (!process.env.ADMIN_PASSWORD) return json({ error: 'Defina ADMIN_PASSWORD nas variáveis de ambiente da Vercel.' }, 500);
  const sig = checkPassword(String(password ?? ''));
  if (!sig) {
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: 'Senha incorreta' }, 401);
  }
  const res = json({ ok: true });
  res.headers.append('set-cookie', `${ADMIN_COOKIE}=${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
  return res;
}

export async function DELETE() {
  const res = json({ ok: true });
  res.headers.append('set-cookie', `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
