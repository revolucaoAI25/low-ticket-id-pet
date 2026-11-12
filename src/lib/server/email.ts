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

/** Um e-mail por order bump de conteúdo, assim que o pagamento dele é aprovado (o PDF vai anexado). */
export async function sendBumpEmail(to: string, bump: { label: string; url: string }): Promise<boolean> {
  const title = `Seu material chegou: ${bump.label} 🐾`;
  const body = `<tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Obrigado pela compra! O <b>${bump.label}</b> está anexado a este e-mail, em PDF. Dá para ler no celular ou imprimir.</td></tr>
  <tr><td align="center" style="padding-top:22px">${button(bump.url, 'Baixar o PDF')}</td></tr>`;
  return send(to, title, layout(title, body), [{ filename: pdfName(bump.label), path: bump.url }]);
}

/** +1 pet aprovado depois do kit: convida a montar o kit do novo pet (mesmo formulário de confirmação). */
export async function sendExtraPetEmail(to: string, token: string): Promise<boolean> {
  const link = `${siteUrl()}/confirmar/${token}`;
  const title = 'Bora montar o kit do seu outro pet? 🐶🐱';
  const body = `<tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Pagamento do pet adicional confirmado! Preencha os dados e a foto do seu outro pet (leva 2 minutinhos) e o kit completo dele chega aqui no e-mail, igualzinho ao primeiro.</td></tr>
  <tr><td align="center" style="padding-top:24px">${button(link, 'Montar o kit do novo pet')}</td></tr>
  <tr><td style="padding-top:24px;font-size:12px;color:#8a7566;text-align:center">Se o botão não abrir, copie este link:<br>${link}</td></tr>`;
  return send(to, title, layout(title, body));
}

export interface KitFile {
  name: string;
  url: string;
  kind: 'kit-pdf' | 'bonus-pdf' | 'zip' | 'ficha' | 'extra' | 'natal-arte' | 'natal-pdf' | 'natal-zip' | 'figurinha' | 'figurinhas-zip';
}

/** Bloco dos order bumps personalizados (Kit Natal e Figurinhas) no e-mail. */
function personalBlock(files: KitFile[], access?: string): string {
  const natalPdf = files.find((f) => f.kind === 'natal-pdf');
  const natalZip = files.find((f) => f.kind === 'natal-zip');
  const hasNatal = files.some((f) => f.kind === 'natal-arte') || natalZip;
  const figZip = files.find((f) => f.kind === 'figurinhas-zip');
  const hasFig = files.some((f) => f.kind === 'figurinha') || figZip;
  if (!hasNatal && !hasFig) return '';
  const a = (href: string, label: string) => `<p style="margin:0 0 10px"><a href="${href}" style="color:#B3121F;font-weight:bold;font-size:15px">${label}</a></p>`;
  return `<tr><td style="padding-top:22px;border-top:1px solid #f0e4d6"></td></tr>
  ${
    hasNatal
      ? `<tr><td style="padding-top:6px;font-size:17px;font-weight:bold">🎄 Kit Natal e Ano Novo</td></tr>
  <tr><td style="padding-top:8px;font-size:15px;line-height:1.5">As 7 artes com a foto do seu pet, prontas para postar e compartilhar, e o PDF com cartões e etiquetas de presente para imprimir.</td></tr>
  <tr><td style="padding-top:12px">${access ? a(access, '👉 Ver e salvar as artes no celular') : ''}${natalZip ? a(natalZip.url, '⬇ Todas as artes (.zip)') : ''}${natalPdf ? a(natalPdf.url, '⬇ Cartões e etiquetas para imprimir (PDF)') : ''}</td></tr>`
      : ''
  }
  ${
    hasFig
      ? `<tr><td style="padding-top:14px;font-size:17px;font-weight:bold">💬 Figurinhas para o WhatsApp</td></tr>
  <tr><td style="padding-top:8px;font-size:15px;line-height:1.5">34 figurinhas com a carinha do seu pet (frases do dia a dia, memes e de fim de ano). Já vêm sem fundo. Salve as que quiser pela sua área no site; no WhatsApp, toque no ícone de figurinha, em <b>Criar</b>, escolha a imagem e envie. Depois é só tocar nela e escolher <b>Adicionar aos favoritos</b>.</td></tr>
  <tr><td style="padding-top:12px">${access ? a(access, '👉 Abrir as figurinhas no celular') : ''}${figZip ? a(figZip.url, '⬇ Todas as figurinhas (.zip, com instruções)') : ''}</td></tr>`
      : ''
  }`;
}

/** Order bump personalizado gerado depois do kit (ou gerado de novo): e-mail só com ele. */
export async function sendExtrasEmail(to: string, doNome: string, files: KitFile[], access: string): Promise<boolean> {
  const quem = doNome && doNome !== 'do seu pet' ? doNome : 'do seu pet';
  const natal = files.some((f) => f.kind.startsWith('natal'));
  const fig = files.some((f) => f.kind.startsWith('figurinha'));
  const title = natal && fig ? `O Kit Natal e as figurinhas ${quem} chegaram! 🎄` : natal ? `O Kit Natal ${quem} chegou! 🎄` : `As figurinhas ${quem} chegaram! 💬`;
  const body = `<tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Prontinho! Tudo foi feito com a foto ${quem}. Guarde este e-mail: os links ficam sempre disponíveis.</td></tr>${personalBlock(files, access)}`;
  const pdf = files.find((f) => f.kind === 'natal-pdf');
  return send(to, title, layout(title, body), pdf ? [{ filename: pdf.name, path: pdf.url }] : undefined);
}

/** Bump personalizado aprovado depois do kit pronto: chama para gerar na área do cliente. */
export async function sendPersonalBumpEmail(to: string, token: string, bumpName: string, doNome?: string): Promise<boolean> {
  const link = `${siteUrl()}/confirmar/${token}`;
  const quem = doNome && doNome !== 'do seu pet' ? doNome : 'do seu pet';
  const title = `${bumpName}: falta só um toque! 🐾`;
  const body = `<tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Pagamento confirmado! O <b>${bumpName}</b> é feito com a foto ${quem}. Abra a sua área e toque em <b>Gerar agora</b>: fica pronto em segundos e chega aqui no e-mail.</td></tr>
  <tr><td align="center" style="padding-top:24px">${button(link, 'Gerar agora')}</td></tr>
  <tr><td style="padding-top:24px;font-size:12px;color:#8a7566;text-align:center">Se o botão não abrir, copie este link:<br>${link}</td></tr>`;
  return send(to, title, layout(title, body));
}

/** Kit gerado: envia os PDFs anexados e os links para as imagens. */
export async function sendKitEmail(to: string, doNome: string, files: KitFile[], extraLinks: { label: string; url: string }[] = [], access?: string): Promise<boolean> {
  const quem = doNome && doNome !== 'do seu pet' ? doNome : 'do seu pet';
  const title = `O kit ${quem} chegou! 🎉`;
  const pdfs = files.filter((f) => f.kind === 'kit-pdf' || f.kind === 'bonus-pdf');
  const zip = files.find((f) => f.kind === 'zip');
  const ficha = files.find((f) => f.kind === 'ficha');
  const links = [
    ...pdfs.map((f) => ({ label: f.kind === 'kit-pdf' ? 'Documentos para imprimir (PDF)' : 'Bônus: Kit Aniversário e Kit Quem Cuida (PDF)', url: f.url })),
    ...(zip ? [{ label: 'Imagens soltas em alta resolução (.zip, opcional)', url: zip.url }] : []),
    ...(ficha ? [{ label: 'Identidade que abre no QR Code da tag', url: ficha.url }] : []),
    ...extraLinks,
  ];
  const body = `
  <tr><td style="padding-top:12px;font-size:16px;line-height:1.5;text-align:center">Os arquivos estão anexados a este e-mail: <b>o PDF dos documentos</b> (comece por ele: as páginas 2 a 5 explicam como imprimir e montar), <b>o PDF de bônus</b> personalizados e os guias em PDF. Imprima em A4, em tamanho real. Guarde este e-mail: os links abaixo ficam sempre disponíveis.</td></tr>
  <tr><td style="padding-top:20px">${links
    .map((l) => `<p style="margin:0 0 10px"><a href="${l.url}" style="color:#6F2A7A;font-weight:bold;font-size:15px">⬇ ${l.label}</a></p>`)
    .join('')}</td></tr>
  <tr><td style="padding-top:16px;font-size:14px;line-height:1.5;color:#6b5a4e"><b>Dica de impressão:</b> para o RG, a CNH e as carteirinhas, use papel fotográfico ou couchê (180 g ou mais) e plastifique. A tag ossinho fica ótima plastificada num porta-tag de pet shop.</td></tr>
  ${personalBlock(files, access)}`;
  // Anexos: os PDFs gerados + os guias fixos (Calendário e Viagem). Os order bumps vão em e-mails próprios.
  const guides = extraLinks.filter((l) => l.label.startsWith('Bônus:'));
  return send(
    to,
    title,
    layout(title, body),
    [...pdfs.map((f) => ({ filename: f.name, path: f.url })), ...guides.map((g) => ({ filename: pdfName(g.label.replace(/^Bônus: /, '')), path: g.url }))],
  );
}
