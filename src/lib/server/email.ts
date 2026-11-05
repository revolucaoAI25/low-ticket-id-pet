import 'server-only';
import { siteUrl } from '@/lib/site-url';

/** E-mail com o link mágico da área do pet (Resend). Sem RESEND_API_KEY, não envia e segue. */
export async function sendAccessEmail(to: string, token: string, doNome?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || !to) return false;
  const link = `${siteUrl()}/kit/${token}`;
  // doNome: "do Paçoca", "da Mel"…
  const titulo = doNome && doNome !== 'do seu pet' ? `O kit ${doNome} está liberado! 🐾` : 'Seu Kit Identidade Pet está liberado! 🐾';
  const html = `<!doctype html><html><body style="margin:0;background:#FFF8EF;font-family:Arial,Helvetica,sans-serif;color:#49382F">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="100%" style="max-width:480px;background:#fff;border-radius:24px;padding:32px" cellpadding="0" cellspacing="0">
  <tr><td align="center"><img src="${siteUrl()}/brand/logo.png" width="140" alt="Clube do Focinho" style="display:block"></td></tr>
  <tr><td style="padding-top:20px;font-size:24px;font-weight:bold;text-align:center">${titulo}</td></tr>
  <tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Seus documentos estão prontos pra baixar e imprimir. Guarde este e-mail: é por esse link que você volta para a área do pet, completa os dados e ativa o Modo Perdido da tag.</td></tr>
  <tr><td align="center" style="padding-top:24px"><a href="${link}" style="background:#6F2A7A;color:#fff;text-decoration:none;font-weight:bold;font-size:18px;padding:16px 28px;border-radius:16px;display:inline-block">Abrir o kit</a></td></tr>
  <tr><td style="padding-top:24px;font-size:12px;color:#8a7566;text-align:center">Se o botão não abrir, copie este link: <br>${link}</td></tr>
  </table>
  <p style="font-size:11px;color:#8a7566;max-width:480px">Produto digital personalizado de uso pessoal. Não tem validade oficial e não substitui documentos emitidos por médico-veterinário ou órgãos públicos.</p>
  </td></tr></table></body></html>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject: titulo, html }),
    });
    if (!r.ok) console.error('resend', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('resend', e);
    return false;
  }
}
