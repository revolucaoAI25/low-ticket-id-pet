import 'server-only';
import { siteUrl } from '@/lib/site-url';

const FOOTER =
  'Produto digital personalizado de uso pessoal. Não tem validade oficial e não substitui documentos emitidos por médico-veterinário ou órgãos públicos.';

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FFF8EF;font-family:Arial,Helvetica,sans-serif;color:#49382F">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="100%" style="max-width:520px;background:#fff;border-radius:24px;padding:32px" cellpadding="0" cellspacing="0">
  <tr><td align="center"><img src="${siteUrl()}/brand/logo.png" width="130" alt="Clube do Focinho" style="display:block"></td></tr>
  <tr><td style="padding-top:20px;font-size:24px;font-weight:bold;text-align:center">${title}</td></tr>
  ${body}
  </table>
  <p style="font-size:11px;color:#8a7566;max-width:520px">${FOOTER}</p>
  </td></tr></table></body></html>`;
}

const button = (href: string, label: string, color = '#6F2A7A') =>
  `<a href="${href}" style="background:${color};color:#fff;text-decoration:none;font-weight:bold;font-size:17px;padding:15px 26px;border-radius:14px;display:inline-block">${label}</a>`;

async function send(to: string, subject: string, html: string, attachments?: { filename: string; path: string }[]): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, attachments }),
    });
    if (!r.ok) console.error('resend', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('resend', e);
    return false;
  }
}

/** Pagamento aprovado: pede para conferir os dados (link da página de confirmação). */
export async function sendConfirmEmail(to: string, token: string, doNome?: string, bumps: { label: string; url: string }[] = []): Promise<boolean> {
  const link = `${siteUrl()}/confirmar/${token}`;
  const quem = doNome && doNome !== 'do seu pet' ? doNome : 'do seu pet';
  const title = `Falta só um passo pro kit ${quem}! 🐾`;
  const body = `
  <tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Pagamento confirmado! Agora é só conferir os dados ${quem} e completar o que faltar. Em seguida você recebe todos os documentos aqui no e-mail.</td></tr>
  <tr><td align="center" style="padding-top:24px">${button(link, 'Conferir e receber o kit')}</td></tr>
  <tr><td style="padding-top:24px;font-size:12px;color:#8a7566;text-align:center">Se o botão não abrir, copie este link:<br>${link}</td></tr>
  ${bumpsBlock(bumps)}`;
  return send(to, title, layout(title, body), bumps.map((b) => ({ filename: pdfName(b.label), path: b.url })));
}

const pdfName = (label: string) =>
  label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '.pdf';

function bumpsBlock(bumps: { label: string; url: string }[]): string {
  if (!bumps.length) return '';
  return `<tr><td style="padding-top:24px;font-size:15px;line-height:1.5"><b>Seus extras já estão anexados:</b>${bumps
    .map((b) => `<p style="margin:8px 0 0"><a href="${b.url}" style="color:#6F2A7A;font-weight:bold">⬇ ${b.label}</a></p>`)
    .join('')}</td></tr>`;
}

/** Order bump comprado em pedido separado: entrega na hora. */
export async function sendBumpsEmail(to: string, bumps: { label: string; url: string }[]): Promise<boolean> {
  if (!bumps.length) return false;
  const title = 'Seu extra chegou! 🐾';
  const body = `<tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Obrigado pela compra! O material está anexado a este e-mail.</td></tr>${bumpsBlock(bumps)}`;
  return send(to, title, layout(title, body), bumps.map((b) => ({ filename: pdfName(b.label), path: b.url })));
}

export interface KitFile {
  name: string;
  url: string;
  kind: 'kit-pdf' | 'bonus-pdf' | 'zip' | 'ficha' | 'extra';
}

/** Kit gerado: envia os PDFs anexados e os links para as imagens. */
export async function sendKitEmail(to: string, doNome: string, files: KitFile[], extraLinks: { label: string; url: string }[] = []): Promise<boolean> {
  const quem = doNome && doNome !== 'do seu pet' ? doNome : 'do seu pet';
  const title = `O kit ${quem} chegou! 🎉`;
  const pdfs = files.filter((f) => f.kind === 'kit-pdf' || f.kind === 'bonus-pdf');
  const zip = files.find((f) => f.kind === 'zip');
  const ficha = files.find((f) => f.kind === 'ficha');
  const links = [
    ...pdfs.map((f) => ({ label: f.kind === 'kit-pdf' ? 'Kit completo para imprimir (PDF)' : 'Bônus personalizados (PDF)', url: f.url })),
    ...(zip ? [{ label: 'Imagens soltas em alta resolução (.zip, opcional)', url: zip.url }] : []),
    ...(ficha ? [{ label: 'Identidade que abre no QR Code da tag', url: ficha.url }] : []),
    ...extraLinks,
  ];
  const body = `
  <tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Está tudo num PDF só, anexado a este e-mail: capa, instruções de montagem, documentos e bônus. É só imprimir em A4 (tamanho real), recortar na linha pontilhada e plastificar. Guarde este e-mail: os links abaixo ficam sempre disponíveis.</td></tr>
  <tr><td style="padding-top:20px">${links
    .map((l) => `<p style="margin:0 0 10px"><a href="${l.url}" style="color:#6F2A7A;font-weight:bold;font-size:15px">⬇ ${l.label}</a></p>`)
    .join('')}</td></tr>
  <tr><td style="padding-top:16px;font-size:14px;line-height:1.5;color:#6b5a4e"><b>Dica de impressão:</b> para o RG, a CNH e as carteirinhas, use papel fotográfico ou couchê (180 g ou mais) e plastifique. A tag ossinho fica ótima plastificada num porta-tag de pet shop.</td></tr>`;
  return send(
    to,
    title,
    layout(title, body),
    pdfs.map((f) => ({ filename: f.name, path: f.url })),
  );
}
