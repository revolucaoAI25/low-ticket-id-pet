'use client';

import { doPet, petName } from '@/lib/pet';
import type { DocContext } from '../types';
import { photoCircle } from '../common';
import { FONT_BODY, FONT_DISPLAY, drawContain, heart, line, paw, rr, text } from '../draw';
import type { Ctx } from '../draw';
import { pageOf, pagesLabel } from '../plan';
import type { DocDef } from '../types';

/**
 * Começo do PDF único: capa, sumário, "antes de imprimir" e o passo a passo de montagem.
 * Os números de página vêm do plano de impressão (src/lib/docs/plan.ts).
 */

const W = 1240;
const H = 1754;
const ROXO = '#6F2A7A';
const ROXO_CLARO = '#F1E6F3';
const AMARELO = '#F5A524';
const AMARELO_CLARO = '#FFF1D6';
const CREME = '#FFF8EF';
const INK = '#3a2a22';
const BODY = 'rgba(58,42,34,.86)';
const MUTED = 'rgba(58,42,34,.58)';
const X0 = 90;
const CW = W - X0 * 2;

/* ---------- utilitários de texto ---------- */

function font(ctx: Ctx, size: number, weight = 600, family: 'body' | 'display' = 'body') {
  ctx.font = `${weight} ${size}px ${family === 'display' ? FONT_DISPLAY : FONT_BODY}`;
}

function lines(ctx: Ctx, s: string, maxW: number, size: number, weight = 600): string[] {
  font(ctx, size, weight);
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      out.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}

/** Escreve um parágrafo e devolve o y logo abaixo. Trechos entre ** ficam em negrito. */
function para(ctx: Ctx, s: string, x: number, y: number, maxW: number, size: number, lh: number, color = BODY, draw = true): number {
  const ls = lines(ctx, s.replace(/\*\*/g, ''), maxW, size);
  if (draw) {
    // negrito simples: palavra a palavra, alternando quando encontra **
    let bold = false;
    const words = s.split(/\s+/);
    let wi = 0;
    ls.forEach((ln, li) => {
      let cx = x;
      const count = ln.split(' ').length;
      for (let k = 0; k < count; k++, wi++) {
        let w = words[wi] ?? '';
        const opens = w.startsWith('**');
        if (opens) bold = true;
        const closes = w.includes('**', opens ? 2 : 0) || (w.endsWith('**') && !opens);
        w = w.replace(/\*\*/g, '');
        font(ctx, size, bold ? 800 : 600);
        ctx.fillStyle = bold ? INK : color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(w, cx, y + li * lh);
        cx += ctx.measureText(w + ' ').width;
        if (closes) bold = false;
      }
    });
  }
  return y + ls.length * lh;
}

function chip(ctx: Ctx, s: string, xRight: number, yMid: number, bg = ROXO_CLARO, color = ROXO) {
  font(ctx, 22, 800);
  const w = ctx.measureText(s).width + 36;
  rr(ctx, xRight - w, yMid - 22, w, 44, 22);
  ctx.fillStyle = bg;
  ctx.fill();
  text(ctx, s, xRight - w / 2, yMid + 8, { size: 22, weight: 800, color, align: 'center' });
  return w;
}

function numberDot(ctx: Ctx, n: number | string, cx: number, cy: number, r: number, bg = ROXO) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  text(ctx, String(n), cx, cy + r * 0.38, { size: r * 1.1, weight: 900, color: '#fff', align: 'center' });
}

function bg(ctx: Ctx) {
  ctx.fillStyle = CREME;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r] of [
    [70, 120, -0.4],
    [W - 80, 210, 0.4],
    [60, H - 200, 0.2],
    [W - 70, H - 130, -0.3],
  ] as const)
    paw(ctx, x, y, 90, 'rgba(111,42,122,.06)', r);
}

/** Cabeçalho das páginas de instrução. Devolve o y onde o conteúdo começa. */
function header(ctx: Ctx, kicker: string, title: string, sub?: string): number {
  text(ctx, kicker.toUpperCase(), W / 2, 104, { size: 22, weight: 900, color: AMARELO, align: 'center', letterSpacing: 5 });
  text(ctx, title, W / 2, 184, { size: 68, weight: 700, family: 'display', color: ROXO, align: 'center', maxWidth: CW });
  if (sub) text(ctx, sub, W / 2, 236, { size: 27, weight: 700, color: MUTED, align: 'center', maxWidth: CW });
  return sub ? 282 : 236;
}

function footer(ctx: Ctx, page: number) {
  line(ctx, X0, H - 92, W - X0, H - 92, 'rgba(58,42,34,.12)', 2);
  text(ctx, `Kit Identidade Pet · Clube do Focinho`, X0, H - 52, { size: 20, weight: 700, color: MUTED });
  text(ctx, `pág. ${page}`, W - X0, H - 52, { size: 20, weight: 800, color: MUTED, align: 'right' });
}

/* ---------- cartões de passo a passo ---------- */

interface StepCard {
  title: string;
  pages?: string;
  steps: string[];
  tip?: string;
}

const PAD = 28;
const STEP_SIZE = 23;
const STEP_LH = 31;

function stepCard(ctx: Ctx, card: StepCard, x: number, y: number, w: number, draw: boolean): number {
  const innerX = x + PAD;
  const textX = innerX + 46;
  const textW = w - PAD * 2 - 46;
  const titleY = y + PAD + 30;
  if (draw) {
    text(ctx, card.title, innerX, titleY, { size: 33, weight: 700, family: 'display', color: INK, maxWidth: w - PAD * 2 - 220 });
    if (card.pages) chip(ctx, card.pages, x + w - PAD, titleY - 11);
  }
  let cy = titleY + 14;
  card.steps.forEach((s, i) => {
    const base = cy + 30;
    if (draw) numberDot(ctx, i + 1, innerX + 16, base - 8, 16);
    cy = para(ctx, s, textX, base, textW, STEP_SIZE, STEP_LH, BODY, draw) - STEP_LH + 16;
  });
  if (card.tip) {
    const tipLines = lines(ctx, card.tip, w - PAD * 2 - 40, 20, 700).length;
    const th = tipLines * 28 + 24;
    cy += 18;
    if (draw) {
      rr(ctx, innerX, cy, w - PAD * 2, th, 14);
      ctx.fillStyle = AMARELO_CLARO;
      ctx.fill();
      para(ctx, card.tip, innerX + 20, cy + 32, w - PAD * 2 - 40, 20, 28, '#7a4e00');
    }
    cy += th;
  }
  return cy + PAD;
}

/** Desenha os cartões em sequência e devolve o y final. */
function cards(ctx: Ctx, list: StepCard[], y: number, gap = 20): number {
  for (const card of list) {
    const h = stepCard(ctx, card, X0, y, CW, false) - y;
    rr(ctx, X0, y, CW, h, 26);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(111,42,122,.10)';
    ctx.lineWidth = 2;
    ctx.stroke();
    stepCard(ctx, card, X0, y, CW, true);
    y += h + gap;
  }
  return y;
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill = '#fff') {
  rr(ctx, x, y, w, h, 26);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(111,42,122,.10)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function sectionTitle(ctx: Ctx, s: string, x: number, y: number) {
  text(ctx, s, x, y, { size: 34, weight: 700, family: 'display', color: INK });
}

function certidaoName(c: DocContext): string {
  return c.pet.origin === 'adocao' ? 'Certidão de Adoção' : 'Certidão de Nascimento';
}

/* ---------- páginas ---------- */

function drawCapa(ctx: Ctx, c: DocContext, a: { background: HTMLImageElement | null; logo: HTMLImageElement | null; photo: HTMLImageElement | null }) {
  if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
  else bg(ctx);
  if (a.logo) drawContain(ctx, a.logo, W / 2 - 230, 150, 460, 420);
  text(ctx, 'KIT IDENTIDADE PET', W / 2, 680, { size: 44, weight: 900, color: ROXO, align: 'center', letterSpacing: 8 });
  photoCircle(ctx, a.photo, c.pet, W / 2, 1000, 230, { ring: 18, ringColor: AMARELO });
  const name = petName(c.pet) === 'seu pet' ? '' : petName(c.pet);
  text(ctx, name ? `O kit ${doPet(c.pet)}` : 'O kit do seu pet', W / 2, 1360, { size: 96, weight: 700, family: 'display', color: INK, align: 'center', maxWidth: W - 200 });
  heart(ctx, W / 2, 1440, 50, AMARELO);
  text(ctx, 'Feito com carinho pelo Clube do Focinho', W / 2, 1530, { size: 32, weight: 700, color: MUTED, align: 'center' });
  text(ctx, 'Antes de imprimir, leia as páginas 2 a 5.', W / 2, 1640, { size: 26, weight: 800, color: ROXO, align: 'center' });
}

function drawSumario(ctx: Ctx, c: DocContext) {
  bg(ctx);
  let y = header(ctx, 'Comece por aqui', 'O que tem no seu kit', 'Marque cada item quando estiver impresso e montado.');
  const groups: { title: string; items: [string, string, string][] }[] = [
    {
      title: 'Documentos',
      items: [
        [certidaoName(c), 'Para emoldurar ou guardar', pagesLabel('certidao')],
        ['RG do Pet', 'Verde, colorido e República Pet', pagesLabel('rg')],
        ['CNH Pet, Torcedor e Ficha', 'Os documentos de bolso', pagesLabel('bolso')],
        ['Tag Ossinho com QR Code', '6 tags em 3 tamanhos', pagesLabel('tag')],
        ['Passaporte de Aventuras', 'Capa e miolo (frente e verso)', pagesLabel('passaporte-capa', 'passaporte-miolo-2')],
        ['Carteira de Vacinação', 'Dobrável (frente e verso)', pagesLabel('vacina-fora', 'vacina-dentro')],
      ],
    },
    {
      title: 'Bônus (em arquivos separados, no mesmo e-mail)',
      items: [
        ['Kit Aniversário e Kit Quem Cuida', 'Convite, topo de bolo, plaquinhas, certificado e ficha de rotina', 'PDF de Bônus'],
        ['Calendário de Saúde por Idade', 'Para cão, gato e outros pets', 'PDF à parte'],
        ['Guia: Como Viajar com seu Pet', 'Carro, avião, ônibus e hotel', 'PDF à parte'],
      ],
    },
  ];
  y += 10;
  for (const g of groups) {
    text(ctx, g.title.toUpperCase(), X0, y + 40, { size: 22, weight: 900, color: AMARELO, letterSpacing: 4 });
    y += 62;
    const rowH = 92;
    box(ctx, X0, y, CW, g.items.length * rowH + 16);
    g.items.forEach(([t, d, p], i) => {
      const ry = y + 8 + i * rowH;
      if (i) line(ctx, X0 + 30, ry, X0 + CW - 30, ry, 'rgba(58,42,34,.08)', 2);
      // caixinha de marcar
      rr(ctx, X0 + 30, ry + 26, 40, 40, 9);
      ctx.strokeStyle = ROXO;
      ctx.lineWidth = 3;
      ctx.stroke();
      text(ctx, t, X0 + 96, ry + 44, { size: 29, weight: 800, color: INK, maxWidth: CW - 420 });
      text(ctx, d, X0 + 96, ry + 76, { size: 21, weight: 600, color: MUTED, maxWidth: CW - 420 });
      chip(ctx, p, X0 + CW - 30, ry + rowH / 2);
    });
    y += g.items.length * rowH + 16 + 18;
  }
  // ordem sugerida
  y += 16;
  const steps = [
    `Leia as **páginas 3 a 5** (leva 5 minutos e evita desperdício).`,
    `Imprima primeiro **só a pág. ${pageOf('rg')}** (RG) e confira a régua de 5 cm no rodapé.`,
    'Deu certo? Imprima o resto e monte com calma. Vale chamar a família!',
  ];
  const bh = 74 + steps.length * 62;
  box(ctx, X0, y, CW, bh, ROXO_CLARO);
  sectionTitle(ctx, 'Ordem que dá certo', X0 + 30, y + 54);
  steps.forEach((s, i) => {
    numberDot(ctx, i + 1, X0 + 50, y + 104 + i * 62, 18);
    para(ctx, s, X0 + 86, y + 113 + i * 62, CW - 120, 24, 30);
  });
  footer(ctx, pageOf('sumario'));
}

function drawAntes(ctx: Ctx) {
  bg(ctx);
  let y = header(ctx, 'Antes de imprimir', 'Configure, confira e separe', 'Três minutos aqui e tudo sai no tamanho certo.');

  // 1. impressora
  y = cards(
    ctx,
    [
      {
        title: 'Configure a impressora',
        steps: [
          'Abra o PDF no computador (no celular, use o app da sua impressora).',
          'Em **Escala** ou **Tamanho**, escolha **"Tamanho real"** ou **100%**. Nunca "Ajustar à página".',
          'Papel **A4**, impressão **colorida** e qualidade **alta** (ou "Melhor").',
          `Para imprimir só algumas páginas, use **Páginas** (ex.: ${pageOf('rg')}-${pageOf('tag')}).`,
        ],
        tip: `Teste antes: imprima só a pág. ${pageOf('rg')} e meça a régua do rodapé. Tem que dar 5 cm. Deu menos? A escala não está em 100%.`,
      },
    ],
    y,
  );

  // 2. papel
  const rows: [string, string, string][] = [
    ['RG, CNH, Torcedor, Ficha e Tags', pagesLabel('rg', 'tag'), 'Fotográfico ou couchê 180 a 250 g'],
    ['Certidão e capa do passaporte', `págs. ${pageOf('certidao')} e ${pageOf('passaporte-capa')}`, 'Couchê ou offset 180 g'],
    ['Miolo do passaporte e Vacinação', pagesLabel('passaporte-miolo-1', 'vacina-dentro'), 'Sulfite 90 g ou offset 120 g'],
    ['Festa e certificado (Bônus)', 'PDF de Bônus', 'Couchê 180 g'],
    ['Quem Cuida (Bônus)', 'PDF de Bônus', 'Sulfite comum'],
    ['Calendário, Guia de Viagem e extras', 'PDFs à parte', 'Sulfite (ou só no celular)'],
  ];
  const rowH = 50;
  const th = 88 + rows.length * rowH + 18;
  box(ctx, X0, y, CW, th);
  sectionTitle(ctx, 'Qual papel usar', X0 + PAD, y + 64);
  text(ctx, 'Sem papel especial? Sai em sulfite também, só fica mais fininho.', X0 + CW - PAD, y + 62, { size: 20, weight: 700, color: MUTED, align: 'right', maxWidth: 520 });
  rows.forEach(([a, p, b], i) => {
    const ry = y + 88 + i * rowH;
    if (i % 2 === 0) {
      rr(ctx, X0 + 18, ry, CW - 36, rowH, 12);
      ctx.fillStyle = '#FBF6FC';
      ctx.fill();
    }
    text(ctx, a, X0 + PAD + 4, ry + 33, { size: 22, weight: 800, color: INK, maxWidth: 440 });
    text(ctx, p, X0 + 520, ry + 33, { size: 21, weight: 700, color: ROXO, maxWidth: 170 });
    text(ctx, b, X0 + CW - PAD - 4, ry + 33, { size: 21, weight: 700, color: BODY, align: 'right', maxWidth: 330 });
  });
  y += th + 16;

  // 3. materiais
  const mats = [
    'Tesoura (ou estilete, régua e base de corte)',
    'Cola bastão ou fita dupla face',
    'Plastificação (papelaria) ou plástico adesivo',
    'Argola de chaveiro e furador',
    'Grampeador (para o passaporte)',
    'Palitos de churrasco (topo de bolo e plaquinhas)',
  ];
  const mh = 88 + Math.ceil(mats.length / 2) * 46 + 8;
  box(ctx, X0, y, CW, mh);
  sectionTitle(ctx, 'Separe os materiais', X0 + PAD, y + 64);
  mats.forEach((m, i) => {
    const col = i % 2;
    const r = Math.floor(i / 2);
    const mx = X0 + PAD + col * (CW / 2);
    const my = y + 106 + r * 46;
    paw(ctx, mx + 12, my - 8, 26, AMARELO);
    text(ctx, m, mx + 36, my, { size: 21, weight: 700, color: BODY, maxWidth: CW / 2 - 70 });
  });
  y += mh + 16;

  // 4. sem impressora
  cards(
    ctx,
    [
      {
        title: 'Não tem impressora?',
        steps: [
          `Mande o PDF para uma gráfica rápida ou papelaria e peça: **"colorido, tamanho real, sem ajustar à página"**, com papel fotográfico nas págs. ${pageOf('rg')} a ${pageOf('tag')}. Aproveite e peça a plastificação.`,
        ],
      },
    ],
    y,
  );
  footer(ctx, pageOf('antes'));
}

function drawMontarDocs(ctx: Ctx, c: DocContext) {
  bg(ctx);
  const y = header(ctx, 'Passo a passo', 'Como montar os documentos', 'Recorte sempre por cima da linha pontilhada.');
  cards(
    ctx,
    [
      {
        title: 'RG do Pet (3 versões)',
        pages: pagesLabel('rg'),
        steps: [
          'Recorte as 6 peças. Cada linha da folha tem a frente (esquerda) e o verso (direita) de um RG.',
          'Cole a frente no verso, costas com costas, alinhando bem as bordas.',
          'Plastifique e recorte deixando 2 mm de plástico em volta.',
        ],
        tip: 'Dica: a plastificação a quente da papelaria deixa com cara de documento de verdade e dura anos.',
      },
      {
        title: 'CNH Pet e Carteirinha de Torcedor',
        pages: pagesLabel('bolso'),
        steps: ['Igual ao RG: recorte, cole a frente no verso e plastifique.', 'Na CNH, a frente fica em cima e o verso logo abaixo dela.'],
      },
      {
        title: 'Ficha de Identificação',
        pages: pagesLabel('bolso'),
        steps: ['Recorte e plastifique (é uma peça só).', 'Guarde na carteira, na bolsa de passeio ou na porta da geladeira. Ela tem tudo de quem cuida.'],
      },
      {
        title: 'Tag Ossinho com QR Code',
        pages: pagesLabel('tag'),
        steps: [
          'Escolha o tamanho (G, M ou P) e recorte o nome e o QR Code do mesmo tamanho.',
          'Cole um no outro, plastifique, fure na bolinha e prenda na coleira com uma argola.',
          'Teste com a câmera do celular: o QR Code abre a identidade com o seu contato.',
        ],
        tip: 'As tags que sobram são reserva. Gastou? Imprima de novo: o QR Code continua o mesmo.',
      },
      {
        title: certidaoName(c),
        pages: pagesLabel('certidao'),
        steps: ['Imprima em papel 180 g. Ela já está no tamanho A4, sem precisar recortar.', 'Fica linda numa moldura A4 ou numa pasta com plástico.'],
      },
    ],
    y,
  );
  footer(ctx, pageOf('montar-docs'));
}

function drawMontarMais(ctx: Ctx) {
  bg(ctx);
  const y = header(ctx, 'Passo a passo', 'Passaporte e Vacinação', 'Os dois são impressos frente e verso.');
  const end = cards(
    ctx,
    [
      {
        title: 'Passaporte de Aventuras',
        pages: pagesLabel('passaporte-capa', 'passaporte-miolo-2'),
        steps: [
          `Capa (pág. ${pageOf('passaporte-capa')}): imprima só de um lado, em papel mais grosso.`,
          `Miolo (págs. ${pageOf('passaporte-miolo-1')} e ${pageOf('passaporte-miolo-2')}): imprima numa folha só, **frente e verso, virando pela borda longa**.`,
          'Recorte as 2 lâminas do miolo, dobre ao meio e encaixe a das páginas 3 a 6 dentro da outra.',
          'Dobre a capa, coloque o miolo dentro e grampeie 2 vezes na dobra.',
        ],
      },
      {
        title: 'Carteira de Vacinação (dobrável)',
        pages: pagesLabel('vacina-fora', 'vacina-dentro'),
        steps: [
          'Imprima as 2 páginas numa folha só, **frente e verso, virando pela borda curta** (folha deitada).',
          'Recorte a borda branca. Dobre o painel da direita para dentro e o da esquerda por cima: a capa fica na frente.',
          'Leve nas consultas: o veterinário anota vacinas, vermífugo e peso.',
        ],
        tip: 'Frente e verso sem impressora duplex: imprima a 1ª página, coloque a folha de volta na bandeja virada e imprima a 2ª. Teste antes com uma folha comum marcada com um X.',
      },
      {
        title: 'E os bônus?',
        steps: [
          '**PDF de Bônus:** Kit Aniversário e Kit Quem Cuida, personalizados, com o passo a passo na primeira página.',
          '**Calendário de Saúde** e **Guia de Viagem:** PDFs à parte. Dá para ler no celular ou imprimir.',
          'Comprou algum conteúdo extra? Ele chega num e-mail só dele, também em PDF.',
        ],
      },
    ],
    y,
  );
  // fechamento
  const fy = Math.max(end, H - 330);
  box(ctx, X0, fy, CW, 166, ROXO_CLARO);
  sectionTitle(ctx, 'Guarde este PDF', X0 + PAD, fy + 56);
  para(ctx, 'Ele não expira: dá para reimprimir quando quiser (tag gasta, RG novo para a carteira...). Alguma dúvida ou algo saiu errado? É só responder o e-mail em que você recebeu o kit.', X0 + PAD, fy + 100, CW - PAD * 2, 23, 31);
  text(ctx, 'Produto personalizado de uso pessoal. Sem validade oficial e não substitui documentos de médico-veterinário ou órgãos públicos.', W / 2, H - 116, {
    size: 18,
    weight: 700,
    color: MUTED,
    align: 'center',
    maxWidth: CW,
  });
  footer(ctx, pageOf('montar-mais'));
}

/** Primeira página do PDF de Bônus: capa e passo a passo do Kit Aniversário e do Kit Quem Cuida. */
function drawBonusCapa(ctx: Ctx, c: DocContext, a: { photo: HTMLImageElement | null }) {
  bg(ctx);
  text(ctx, 'BÔNUS DO KIT IDENTIDADE PET', W / 2, 104, { size: 22, weight: 900, color: AMARELO, align: 'center', letterSpacing: 5 });
  const name = petName(c.pet) === 'seu pet' ? '' : petName(c.pet);
  text(ctx, name ? `Os bônus ${doPet(c.pet)}` : 'Os bônus do seu pet', W / 2, 190, { size: 72, weight: 700, family: 'display', color: ROXO, align: 'center', maxWidth: CW });
  photoCircle(ctx, a.photo, c.pet, W / 2, 370, 120, { ring: 12, ringColor: AMARELO });
  const y = cards(
    ctx,
    [
      {
        title: 'Convite de aniversário',
        pages: pagesLabel('convite'),
        steps: ['Recorte na linha pontilhada e entregue. Ou tire uma foto do convite pronto e mande pelo WhatsApp.'],
      },
      {
        title: 'Topo de bolo e plaquinhas',
        pages: pagesLabel('aniv-topo', 'aniv-plaquinhas'),
        steps: [
          'Imprima em papel 180 g e recorte em volta da borda branca.',
          'Cole um palito de churrasco atrás com fita e espete no bolo. Os redondinhos viram toppers de docinho.',
          'As plaquinhas são para as fotos da festa: segure perto do pet e capriche no clique.',
        ],
      },
      {
        title: 'Certificado de Melhor Pet do Mundo',
        pages: pagesLabel('aniv-certificado'),
        steps: ['Imprima em papel 180 g (folha deitada) e emoldure. Assine com a família.'],
      },
      {
        title: 'Kit Quem Cuida',
        pages: pagesLabel('quemcuida'),
        steps: ['Preencha à caneta: comida, passeios, remédios, manias e contatos.', 'Deixe com quem fica com o pet: avós, pet sitter, creche ou hotel.'],
      },
    ],
    530,
  );
  void y;
  footer(ctx, pageOf('bonus-capa'));
}

const A4 = { w: W, h: H, mm: [210, 297] as [number, number] };

export const guiaDoc: DocDef = {
  id: 'guia',
  title: 'Capa e instruções',
  file: 'Instrucoes-{nome}',
  pages: [
    { id: 'guia-capa', label: 'Capa', ...A4, draw: (ctx, c, a) => drawCapa(ctx, c, a) },
    { id: 'guia-sumario', label: 'O que tem no kit', ...A4, draw: (ctx, c) => drawSumario(ctx, c) },
    { id: 'guia-antes', label: 'Antes de imprimir', ...A4, draw: (ctx) => drawAntes(ctx) },
    { id: 'guia-montar-docs', label: 'Como montar: documentos', ...A4, draw: (ctx, c) => drawMontarDocs(ctx, c) },
    { id: 'guia-montar-mais', label: 'Como montar: passaporte e vacinação', ...A4, draw: (ctx) => drawMontarMais(ctx) },
    { id: 'guia-bonus-capa', label: 'Capa dos bônus', ...A4, draw: (ctx, c, a) => drawBonusCapa(ctx, c, a) },
  ],
};
