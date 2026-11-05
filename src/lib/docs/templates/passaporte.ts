'use client';

/**
 * Passaporte de Aventuras no tamanho de um passaporte de verdade (88 × 125 mm).
 *
 * Montagem (livreto grampeado no meio):
 *  - Folha 1 (só frente): capa aberta (contracapa | lombada | capa) = 179 × 125 mm + instruções.
 *  - Folhas 2 e 3: miolo de 8 páginas, impressas FRENTE E VERSO (virar pela borda longa).
 *    Cada folha A4 traz 2 "lâminas" (176 × 125 mm). Imposição para dobrar e encaixar:
 *      Frente:  [ 8 | 1 ]  e  [ 6 | 3 ]
 *      Verso:   [ 2 | 7 ]  e  [ 4 | 5 ]
 *    Recorta as 2 lâminas, dobra ao meio, encaixa a [6|3] dentro da [8|1], põe dentro da capa e grampeia.
 */

import { cityOf, clubNumber, formatDateBR, g, personalityLabel, petName, sexLabel, tutorNames, addressLine } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { formatPhone, maskNumber, photoBox } from '../common';
import { dashedRect, line, paw, rr, star, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import { laurel } from '../party';
import type { Assets, DocContext, DocDef } from '../types';

const PW = 1240; // A4 retrato a 150 dpi
const PH = 1754;
const MM = PW / 210;
const BW = 88 * MM; // largura da página do passaporte
const BH = 125 * MM;
const SX = (PW - BW * 2) / 2; // lâmina centralizada (espelha certinho no verso)
const ROW1 = 120;
const ROW2 = ROW1 + BH + 70;

const NAVY = '#1C2B4F';
const GOLD = '#A9822B';
const INKS = ['#B23A48', '#2F5DA8', '#2E7D4F', '#7A3E9D', '#C26A1B'];
const TINTS = ['#EAF1F8', '#EEF5EC', '#F7F1E6', '#F1EDF7', '#EAF4F2', '#F8EDEF', '#EDF2F8', '#F6F0E4'];

type PageFn = (ctx: Ctx, w: number, h: number, c: DocContext, a: Assets) => void;

/* ---------- fundo de página de passaporte ---------- */

function pageBase(ctx: Ctx, w: number, h: number, n: number) {
  const tint = TINTS[(n - 1) % TINTS.length];
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  // guilhochê
  ctx.save();
  ctx.strokeStyle = 'rgba(28,43,79,.07)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 34; k++) {
    ctx.beginPath();
    const base = (k / 34) * h * 1.15 - h * 0.05;
    for (let x = 0; x <= w; x += 5) {
      const y = base + Math.sin((x / w) * Math.PI * (2.2 + n * 0.3) + k * 0.5) * 18 + Math.sin((x / w) * Math.PI * 9 + k) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // marca d'água: patinha grande
  ctx.globalAlpha = 0.06;
  paw(ctx, w / 2, h * 0.55, w * 0.62, NAVY, (n % 3) * 0.2 - 0.2);
  ctx.restore();
  // cabeçalho e número de página
  text(ctx, 'PASSAPORTE PET · PET PASSPORT', w / 2, 34, { size: 11, weight: 800, color: 'rgba(28,43,79,.55)', align: 'center', letterSpacing: 2 });
  text(ctx, String(n), w / 2, h - 22, { size: 14, weight: 800, color: 'rgba(28,43,79,.55)', align: 'center' });
}

function title(ctx: Ctx, w: number, pt: string, en: string, y = 82) {
  text(ctx, pt.toUpperCase(), w / 2, y, { size: 26, weight: 700, family: 'display', color: NAVY, align: 'center', letterSpacing: 2, maxWidth: w - 60 });
  text(ctx, en, w / 2, y + 22, { size: 13, weight: 700, color: 'rgba(28,43,79,.55)', align: 'center', italic: true });
}

/** Campo bilíngue: rótulo pequeno (PT / EN) e valor. */
function f(ctx: Ctx, pt: string, en: string, value: string, x: number, y: number, w: number) {
  text(ctx, `${pt} / ${en}`, x, y, { size: 9.5, weight: 800, color: 'rgba(28,43,79,.6)', maxWidth: w });
  if (value) text(ctx, value.toUpperCase(), x, y + 19, { size: 15, weight: 800, color: '#141B2E', maxWidth: w, letterSpacing: 0.4 });
  else line(ctx, x, y + 20, x + w, y + 20, 'rgba(28,43,79,.25)', 1.2);
}

function seal(ctx: Ctx, cx: number, cy: number, r: number) {
  laurel(ctx, cx, cy, r * 1.25, GOLD);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = r * 0.07;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.03;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    star(ctx, cx + Math.cos(a) * r * 0.91, cy + Math.sin(a) * r * 0.91, r * 0.045, GOLD);
  }
  paw(ctx, cx, cy + r * 0.05, r * 0.95, GOLD);
}

/** Carimbo de tinta (imigração). */
function inkStamp(ctx: Ctx, cx: number, cy: number, r: number, ink: string, top: string, mid: string, bottom: string, rot = -0.18, rect = false) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = 0.86;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  if (rect) {
    rr(ctx, -r * 1.25, -r * 0.8, r * 2.5, r * 1.6, 14);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    rr(ctx, -r * 1.25 + 8, -r * 0.8 + 8, r * 2.5 - 16, r * 1.6 - 16, 10);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r - 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  text(ctx, top, 0, -r * 0.38, { size: r * 0.2, weight: 900, color: ink, align: 'center', letterSpacing: 1, maxWidth: r * 1.7 });
  text(ctx, mid, 0, r * 0.12, { size: r * 0.3, weight: 700, family: 'display', color: ink, align: 'center', maxWidth: r * 1.8 });
  text(ctx, bottom, 0, r * 0.5, { size: r * 0.17, weight: 800, color: ink, align: 'center', maxWidth: r * 1.6 });
  ctx.restore();
}

/** Espaço vazio para carimbar/colar adesivo. */
function emptyStamp(ctx: Ctx, cx: number, cy: number, r: number, label: string, round: boolean) {
  if (round) {
    ctx.save();
    ctx.setLineDash([6, 7]);
    ctx.strokeStyle = 'rgba(28,43,79,.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else dashedRect(ctx, cx - r * 1.15, cy - r * 0.8, r * 2.3, r * 1.6, 12, 'rgba(28,43,79,.3)', 2, [6, 7]);
  text(ctx, label, cx, cy - 4, { size: 14, weight: 800, color: 'rgba(28,43,79,.45)', align: 'center', maxWidth: r * 1.8 });
  text(ctx, '___/___/_____', cx, cy + 20, { size: 12, weight: 700, color: 'rgba(28,43,79,.3)', align: 'center' });
}

function passNo(c: DocContext): string {
  return maskNumber('PT' + clubNumber(c.seed + 'pass').replace(/\D/g, '').slice(0, 7), c.preview);
}

function mrzName(c: DocContext): string {
  const n = (petName(c.pet) === 'seu pet' ? 'PET' : petName(c.pet))
    .toUpperCase()
    .normalize('NFD')
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/\s+/g, '<');
  const t = (c.pet.tutors?.[0]?.name ?? '').toUpperCase().normalize('NFD').replace(/[^A-Z ]/g, '').trim().split(/\s+/).pop() ?? '';
  return `P<CDF${t ? t + '<<' : ''}${n}`.padEnd(44, '<').slice(0, 44);
}

function mrzLine2(c: DocContext): string {
  const no = passNo(c).replace(/•/g, '<');
  const d = c.pet.date ? c.pet.date.replace(/-/g, '').slice(2) : '<<<<<<';
  const sx = c.pet.sex === 'femea' ? 'F' : c.pet.sex === 'macho' ? 'M' : '<';
  return `${no}<0CDF${d}0${sx}<<<<<<<AMOR<INFINITO<<<<<`.padEnd(44, '<').slice(0, 44);
}

/* ---------- as 8 páginas ---------- */

const pages: Record<number, PageFn> = {
  // 1. Folha de rosto
  1(ctx, w, h) {
    pageBase(ctx, w, h, 1);
    seal(ctx, w / 2, 180, 78);
    text(ctx, 'PASSAPORTE', w / 2, 340, { size: 40, weight: 700, family: 'display', color: NAVY, align: 'center', letterSpacing: 4 });
    text(ctx, 'PET PASSPORT', w / 2, 368, { size: 14, weight: 800, color: 'rgba(28,43,79,.6)', align: 'center', letterSpacing: 4 });
    line(ctx, w / 2 - 120, 395, w / 2 + 120, 395, GOLD, 2);
    wrap(
      ctx,
      'O titular deste passaporte é um membro muito amado da família. Pedimos a todos que lhe permitam passear livremente, receber carinho e petiscos e, em caso de necessidade, que lhe prestem toda a ajuda para voltar para casa.',
      w / 2,
      440,
      w - 90,
      24,
      { size: 15, weight: 600, color: '#2a3350', align: 'center', maxLines: 7 },
    );
    wrap(ctx, 'The bearer of this passport is a beloved family member. Please let them walk freely and help them get home.', w / 2, 630, w - 100, 20, {
      size: 12,
      weight: 600,
      color: 'rgba(28,43,79,.55)',
      align: 'center',
      maxLines: 3,
      italic: true,
    });
  },

  // 2. Página de dados (biográfica)
  2(ctx, w, h, c, a) {
    pageBase(ctx, w, h, 2);
    const p = c.pet;
    text(ctx, 'PASSAPORTE', 30, 74, { size: 18, weight: 900, color: NAVY, letterSpacing: 2 });
    text(ctx, 'PASSPORT', 30, 92, { size: 11, weight: 700, color: 'rgba(28,43,79,.55)', italic: true });
    f(ctx, 'Tipo', 'Type', 'PET', 190, 70, 60);
    f(ctx, 'Código', 'Code', 'CDF', 268, 70, 70);
    f(ctx, 'Passaporte nº', 'Passport No.', passNo(c), 352, 70, w - 380);
    photoBox(ctx, a.photo, p, 30, 120, 150, 192, 6, { border: 3, borderColor: '#fff', bg: '#E2E8F0' });
    const x = 196;
    const fw = w - x - 28;
    const name = petName(p) === 'seu pet' ? '' : petName(p);
    f(ctx, 'Nome', 'Name', name, x, 128, fw);
    f(ctx, 'Espécie', 'Species', getSpecies(p.species)?.label ?? '', x, 172, fw);
    f(ctx, 'Raça', 'Breed', p.breed ?? '', x, 216, fw);
    f(ctx, 'Sexo', 'Sex', sexLabel(p), x, 260, fw / 2 - 6);
    f(ctx, 'Personalidade', 'Personality', personalityLabel(p) ?? '', x + fw / 2 + 6, 260, fw / 2 - 6);
    const half = (w - 60 - 12) / 2;
    f(ctx, p.origin === 'adocao' ? 'Data de adoção' : 'Data de nascimento', p.origin === 'adocao' ? 'Adoption date' : 'Date of birth', formatDateBR(p.date), 30, 340, half);
    f(ctx, 'Naturalidade', 'Place of birth', cityOf(p), 42 + half, 340, half);
    f(ctx, 'Data de emissão', 'Date of issue', formatDateBR(new Date().toISOString().slice(0, 10)), 30, 386, half);
    f(ctx, 'Válido até', 'Date of expiry', 'Para sempre', 42 + half, 386, half);
    f(ctx, 'Tutores', 'Guardians', tutorNames(p), 30, 432, w - 60);
    // patinha + assinatura
    dashedRect(ctx, 30, 478, 130, 92, 8, 'rgba(28,43,79,.35)', 1.5, [5, 5]);
    text(ctx, 'Patinha / Paw', 95, 590, { size: 10, weight: 800, color: 'rgba(28,43,79,.55)', align: 'center' });
    line(ctx, 180, 556, w - 30, 556, 'rgba(28,43,79,.45)', 1.5);
    text(ctx, 'Assinatura do tutor / Guardian’s signature', 180, 574, { size: 10, weight: 800, color: 'rgba(28,43,79,.55)', maxWidth: w - 210 });
    // zona de leitura (MRZ)
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillRect(0, 612, w, 92);
    ctx.font = `600 17px "OCR B", "Courier New", monospace`;
    ctx.fillStyle = '#141B2E';
    ctx.textAlign = 'left';
    ctx.fillText(mrzName(c), 16, 648);
    ctx.fillText(mrzLine2(c), 16, 680);
  },

  // 3. Informações complementares
  3(ctx, w, h, c) {
    pageBase(ctx, w, h, 3);
    title(ctx, w, 'Informações complementares', 'Additional information');
    const ex = c.pet.extras ?? {};
    const x = 34;
    const fw = w - 68;
    const half = (fw - 14) / 2;
    let y = 150;
    f(ctx, 'Microchip', 'Microchip', ex.microchip ?? '', x, y, fw);
    y += 52;
    f(ctx, 'Pelagem / sinais', 'Coat / marks', ex.coat ?? '', x, y, fw);
    y += 52;
    f(ctx, 'Porte', 'Size', ex.size ?? '', x, y, half);
    f(ctx, 'Peso', 'Weight', ex.weight ?? '', x + half + 14, y, half);
    y += 52;
    f(ctx, 'Alergias', 'Allergies', ex.allergies ?? '', x, y, fw);
    y += 52;
    f(ctx, 'Remédios', 'Medication', ex.medications ?? '', x, y, fw);
    y += 52;
    f(ctx, 'Veterinário', 'Vet', [ex.vetName, ex.vetClinic].filter(Boolean).join(' · '), x, y, fw);
    y += 52;
    f(ctx, 'Telefone do tutor', 'Guardian’s phone', formatPhone(c.pet.tutors?.find((t) => t.phone)?.phone || c.phone), x, y, half);
    f(ctx, 'Emergência', 'Emergency', formatPhone(ex.contacts?.[0]?.phone), x + half + 14, y, half);
    y += 52;
    f(ctx, 'Endereço', 'Address', addressLine(c.pet), x, y, fw);
    y += 66;
    text(ctx, 'OBSERVAÇÕES / REMARKS', x, y, { size: 9.5, weight: 800, color: 'rgba(28,43,79,.6)' });
    for (let i = 0; i < 3; i++) line(ctx, x, y + 30 + i * 30, x + fw, y + 30 + i * 30, 'rgba(28,43,79,.25)', 1.2);
  },

  // 4. Vistos
  4(ctx, w, h, c, a) {
    pageBase(ctx, w, h, 4);
    title(ctx, w, 'Vistos', 'Visas');
    const p = c.pet;
    // Visto permanente (preenchido)
    const vx = 26;
    const vy = 130;
    const vw = w - 52;
    const vh = 250;
    rr(ctx, vx, vy, vw, vh, 12);
    const grad = ctx.createLinearGradient(vx, vy, vx + vw, vy + vh);
    grad.addColorStop(0, '#FCE9EF');
    grad.addColorStop(1, '#E8F1FB');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(178,58,72,.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'VISTO PERMANENTE · PERMANENT VISA', vx + vw / 2, vy + 30, { size: 13, weight: 900, color: '#B23A48', align: 'center', letterSpacing: 1.5, maxWidth: vw - 20 });
    photoBox(ctx, a.photo, p, vx + 16, vy + 48, 96, 122, 6, { border: 2, borderColor: '#fff', bg: '#E2E8F0' });
    const fx = vx + 128;
    const fw = vw - 144;
    f(ctx, 'Destino', 'Destination', 'Lar doce lar', fx, vy + 62, fw);
    f(ctx, 'Entrada', 'Entry', formatDateBR(p.date), fx, vy + 104, fw / 2 - 4);
    f(ctx, 'Entradas', 'Entries', 'Ilimitadas', fx + fw / 2 + 4, vy + 104, fw / 2 - 4);
    f(ctx, 'Tipo', 'Type', 'Amor incondicional', fx, vy + 146, fw);
    f(ctx, 'Anfitriões', 'Hosts', tutorNames(p), vx + 16, vy + 196, vw - 32);
    // Visto de turista (em branco)
    const ty = vy + vh + 30;
    rr(ctx, vx, ty, vw, 230, 12);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(47,93,168,.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'VISTO DE TURISTA · TOURIST VISA', vx + vw / 2, ty + 30, { size: 13, weight: 900, color: '#2F5DA8', align: 'center', letterSpacing: 1.5, maxWidth: vw - 20 });
    f(ctx, 'Destino', 'Destination', '', vx + 18, ty + 62, vw - 36);
    f(ctx, 'Entrada', 'Entry', '', vx + 18, ty + 108, (vw - 50) / 2);
    f(ctx, 'Saída', 'Exit', '', vx + 32 + (vw - 50) / 2, ty + 108, (vw - 50) / 2);
    f(ctx, 'Motivo da viagem', 'Purpose', '', vx + 18, ty + 154, vw - 36);
    inkStamp(ctx, w - 110, ty + 200, 46, '#2E7D4F', 'APROVADO', 'OK!', 'CDF', 0.25);
  },

  // 5. Carimbos (com o primeiro já carimbado)
  5(ctx, w, h, c) {
    pageBase(ctx, w, h, 5);
    title(ctx, w, 'Carimbos', 'Stamps');
    const adot = c.pet.origin === 'adocao';
    inkStamp(ctx, 150, 220, 82, INKS[(petName(c.pet).length || 1) % INKS.length], adot ? 'ADOÇÃO' : 'CHEGADA', 'Lar doce lar', formatDateBR(c.pet.date) || 'BEM-VINDO', -0.16);
    emptyStamp(ctx, w - 140, 230, 70, 'Primeiro passeio', false);
    emptyStamp(ctx, 130, 430, 70, 'Primeira praia', true);
    emptyStamp(ctx, w - 140, 440, 70, 'Primeiro banho', false);
    emptyStamp(ctx, 140, 620, 68, 'Parque favorito', false);
    emptyStamp(ctx, w - 130, 625, 70, 'Casa da vó', true);
  },

  // 6. Mais carimbos
  6(ctx, w, h) {
    pageBase(ctx, w, h, 6);
    title(ctx, w, 'Carimbos', 'Stamps');
    emptyStamp(ctx, 135, 225, 70, 'Viagem de carro', true);
    emptyStamp(ctx, w - 140, 220, 70, 'Trilha', false);
    emptyStamp(ctx, 140, 420, 70, 'Hotelzinho', false);
    emptyStamp(ctx, w - 130, 430, 70, 'Aniversário', true);
    emptyStamp(ctx, 135, 620, 70, 'Novo amigo', true);
    emptyStamp(ctx, w - 140, 615, 70, 'Lugar novo', false);
  },

  // 7. Registro de viagens
  7(ctx, w, h) {
    pageBase(ctx, w, h, 7);
    title(ctx, w, 'Registro de viagens', 'Travel log');
    const x = 26;
    const tw = w - 52;
    const cols: [string, number][] = [
      ['Data', 0.9],
      ['Destino', 1.8],
      ['Transporte', 1.1],
      ['Nota', 0.7],
    ];
    const total = cols.reduce((s, cc) => s + cc[1], 0);
    const y0 = 130;
    const rowH = 46;
    const rows = 11;
    rr(ctx, x, y0, tw, 36 + rows * rowH, 10);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fill();
    ctx.fillStyle = 'rgba(28,43,79,.1)';
    ctx.fillRect(x, y0, tw, 36);
    let cx = x;
    cols.forEach(([l, wgt], i) => {
      const cw = (wgt / total) * tw;
      text(ctx, l.toUpperCase(), cx + cw / 2, y0 + 24, { size: 11, weight: 900, color: NAVY, align: 'center', letterSpacing: 1 });
      if (i) line(ctx, cx, y0, cx, y0 + 36 + rows * rowH, 'rgba(28,43,79,.2)', 1.2);
      cx += cw;
    });
    for (let r = 0; r <= rows; r++) line(ctx, x, y0 + 36 + r * rowH, x + tw, y0 + 36 + r * rowH, 'rgba(28,43,79,.2)', 1.2);
    // estrelinhas na coluna de nota
    const nx = x + tw - (0.7 / total) * tw / 2;
    for (let r = 0; r < rows; r++) for (let i = 0; i < 3; i++) star(ctx, nx - 18 + i * 18, y0 + 36 + r * rowH + rowH / 2, 6, 'rgba(169,130,43,.35)');
  },

  // 8. Lembranças
  8(ctx, w, h, c) {
    pageBase(ctx, w, h, 8);
    title(ctx, w, 'Lembranças', 'Memories');
    dashedRect(ctx, 40, 130, w - 80, 290, 12, 'rgba(28,43,79,.35)', 2, [8, 6]);
    paw(ctx, w / 2, 255, 70, 'rgba(28,43,79,.15)');
    text(ctx, 'Cole aqui a foto da sua aventura favorita', w / 2, 330, { size: 14, weight: 800, color: 'rgba(28,43,79,.45)', align: 'center', maxWidth: w - 120 });
    text(ctx, `A AVENTURA FAVORITA ${g(c.pet, 'DO', 'DA')} ${petName(c.pet) === 'seu pet' ? 'PET' : petName(c.pet).toUpperCase()}`, 40, 470, {
      size: 11,
      weight: 900,
      color: 'rgba(28,43,79,.6)',
      maxWidth: w - 80,
      letterSpacing: 1,
    });
    for (let i = 0; i < 5; i++) line(ctx, 40, 506 + i * 34, w - 40, 506 + i * 34, 'rgba(28,43,79,.25)', 1.2);
    text(ctx, g(c.pet, 'VIAJANTE OFICIAL', 'VIAJANTE OFICIAL'), w / 2, h - 50, { size: 12, weight: 800, color: GOLD, align: 'center', letterSpacing: 2 });
  },
};

/** Desenha uma página do passaporte na posição (x, y) da folha. */
function drawPage(ctx: Ctx, n: number, x: number, y: number, c: DocContext, a: Assets) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.rect(0, 0, BW, BH);
  ctx.clip();
  pages[n](ctx, BW, BH, c, a);
  ctx.restore();
}

/** Lâmina de 2 páginas com linha de corte e marca da dobra. */
function spread(ctx: Ctx, left: number, right: number, y: number, c: DocContext, a: Assets) {
  drawPage(ctx, left, SX, y, c, a);
  drawPage(ctx, right, SX + BW, y, c, a);
  dashedRect(ctx, SX - 4, y - 4, BW * 2 + 8, BH + 8, 4, 'rgba(0,0,0,.35)', 1.5, [6, 6]);
  line(ctx, SX + BW, y - 22, SX + BW, y - 6, 'rgba(0,0,0,.45)', 1.5);
  line(ctx, SX + BW, y + BH + 6, SX + BW, y + BH + 22, 'rgba(0,0,0,.45)', 1.5);
}

function sheetNote(ctx: Ctx, s: string) {
  text(ctx, s, PW / 2, PH - 40, { size: 15, weight: 700, color: 'rgba(0,0,0,.45)', align: 'center', maxWidth: PW - 120 });
}

export const passaporteDoc: DocDef = {
  id: 'passaporte',
  title: 'Passaporte de Aventuras',
  file: 'Passaporte-do-{nome}',
  pages: [
    {
      id: 'passaporte-capa',
      label: 'Capa',
      w: PW,
      h: PH,
      mm: [210, 297],
      template: '/templates/passaporte-capa.webp',
      draw(ctx, _c, a) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, PW, PH);
        const cw = 179.5 * MM;
        const cx = (PW - cw) / 2;
        if (a.background) {
          ctx.drawImage(a.background, cx, ROW1, cw, BH);
        } else {
          ctx.fillStyle = NAVY;
          ctx.fillRect(cx, ROW1, cw, BH);
          seal(ctx, cx + cw * 0.75, ROW1 + BH * 0.5, 120);
        }
        dashedRect(ctx, cx - 4, ROW1 - 4, cw + 8, BH + 8, 4, 'rgba(0,0,0,.35)', 1.5, [6, 6]);
        line(ctx, cx + cw / 2, ROW1 - 22, cx + cw / 2, ROW1 - 6, 'rgba(0,0,0,.45)', 1.5);
        line(ctx, cx + cw / 2, ROW1 + BH + 6, cx + cw / 2, ROW1 + BH + 22, 'rgba(0,0,0,.45)', 1.5);
        // instruções de montagem
        const steps = [
          'Imprima esta folha só de um lado, em papel mais grosso (180 g ou mais). É a capa.',
          'Imprima as 2 folhas seguintes (miolo) em frente e verso, virando pela borda longa.',
          'Recorte a capa e as 4 lâminas do miolo na linha pontilhada.',
          'Dobre cada lâmina ao meio. Encaixe a lâmina com as páginas 3 a 6 dentro da que tem 1, 2, 7 e 8.',
          'Coloque o miolo dentro da capa dobrada e grampeie 2 vezes na dobra (ou costure). Pronto!',
        ];
        text(ctx, 'Como montar o passaporte', PW / 2, ROW1 + BH + 110, { size: 40, weight: 700, family: 'display', color: NAVY, align: 'center' });
        steps.forEach((s, i) => {
          const y = ROW1 + BH + 170 + i * 92;
          ctx.beginPath();
          ctx.arc(150, y, 26, 0, Math.PI * 2);
          ctx.fillStyle = NAVY;
          ctx.fill();
          text(ctx, String(i + 1), 150, y + 10, { size: 28, weight: 900, color: '#fff', align: 'center' });
          wrap(ctx, s, 200, y - 4, PW - 300, 30, { size: 24, weight: 600, color: '#333', maxLines: 2 });
        });
      },
    },
    {
      id: 'passaporte-miolo-1',
      label: 'Miolo · frente',
      w: PW,
      h: PH,
      mm: [210, 297],
      draw(ctx, c, a) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, PW, PH);
        spread(ctx, 8, 1, ROW1, c, a);
        spread(ctx, 6, 3, ROW2, c, a);
        sheetNote(ctx, 'Passaporte · miolo, folha 1 (frente). No verso, imprima a folha seguinte.');
      },
    },
    {
      id: 'passaporte-miolo-2',
      label: 'Miolo · verso',
      w: PW,
      h: PH,
      mm: [210, 297],
      draw(ctx, c, a) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, PW, PH);
        spread(ctx, 2, 7, ROW1, c, a);
        spread(ctx, 4, 5, ROW2, c, a);
        sheetNote(ctx, 'Passaporte · miolo, folha 1 (verso).');
      },
    },
  ],
};
