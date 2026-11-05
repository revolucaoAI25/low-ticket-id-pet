'use client';

/**
 * Carteira de Vacinação dobrável (tri-fold, folha A4 deitada, frente e verso).
 *
 * Planificação (mm), impressa frente e verso virando pela borda LONGA:
 *   Lado de FORA:   [ Cuidados (97) | Contracapa (100) | CAPA (100) ]
 *   Lado de DENTRO: [ Identificação (100) | Vacinas (100) | Rotina (97) ]
 * O painel de 97 mm (Rotina, por dentro) é o que dobra para dentro primeiro: por ser 3 mm menor,
 * não enruga ao fechar. Depois dobra a Identificação por cima e a CAPA fica na frente.
 * Rosa para fêmea, azul para macho (ou quando não informado).
 */

import { addressLine, cityOf, formatDateBR, isFemale, petName, sexLabel, tutorNames, ageLabel } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { formatPhone, photoBox, photoCircle } from '../common';
import { drawContain, heart, line, paw, rr, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import type { DocContext, DocDef } from '../types';

const W = 1754; // 297 mm a 150 dpi
const H = 1240; // 210 mm
const MM = W / 297;
const P100 = 100 * MM;
const P97 = 97 * MM;
const PAD = 44; // margem interna segura (~7,5 mm)

interface Theme {
  bg: string;
  soft: string;
  main: string;
  dark: string;
  line: string;
  ink: string;
}
const ROSA: Theme = { bg: '#FFF5F7', soft: '#FBE4EB', main: '#D9668B', dark: '#9E3D60', line: '#F0C6D4', ink: '#4A2C36' };
const AZUL: Theme = { bg: '#F3F8FD', soft: '#DDEBF9', main: '#3F7FC6', dark: '#245187', line: '#C3D9F0', ink: '#22334A' };
const theme = (c: DocContext) => (isFemale(c.pet) ? ROSA : AZUL);

/* ---------- peças ---------- */

function background(ctx: Ctx, t: Theme) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);
}

/** Marcas de dobra (só nas bordas, para não aparecer no meio do painel). */
function foldMarks(ctx: Ctx, xs: number[], t: Theme) {
  for (const x of xs) {
    line(ctx, x, 0, x, 26, t.main, 2, [6, 5]);
    line(ctx, x, H - 26, x, H, t.main, 2, [6, 5]);
  }
}

function brandLine(ctx: Ctx, x: number, y: number, t: Theme) {
  paw(ctx, x + 12, y - 8, 26, t.main);
  text(ctx, 'Clube do Focinho', x + 34, y, { size: 20, weight: 600, family: 'display', color: t.dark });
}

function panelTitle(ctx: Ctx, x: number, w: number, title: string, subtitle: string, t: Theme) {
  brandLine(ctx, x + PAD, 78, t);
  text(ctx, title, x + PAD, 150, { size: 46, weight: 700, family: 'display', color: t.dark, maxWidth: w - PAD * 2 });
  wrap(ctx, subtitle, x + PAD, 186, w - PAD * 2, 24, { size: 18, weight: 600, color: 'rgba(0,0,0,.45)', maxLines: 2 });
}

function sectionTitle(ctx: Ctx, x: number, y: number, label: string, t: Theme, w?: number) {
  paw(ctx, x + 12, y - 9, 24, t.main, -0.2);
  text(ctx, label, x + 32, y, { size: 24, weight: 700, family: 'display', color: t.dark, maxWidth: w ? w - 40 : undefined });
}

function card(ctx: Ctx, x: number, y: number, w: number, h: number, t: Theme) {
  rr(ctx, x, y, w, h, 20);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = t.line;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

/** Rótulo + valor (preenchido) ou linha para escrever. */
function row(ctx: Ctx, label: string, value: string, x: number, y: number, w: number, t: Theme) {
  text(ctx, label.toUpperCase(), x, y, { size: 13, weight: 900, color: t.dark, letterSpacing: 1.2, maxWidth: w });
  if (value) text(ctx, value, x, y + 30, { size: 21, weight: 700, color: t.ink, maxWidth: w });
  line(ctx, x, y + 40, x + w, y + 40, t.line, 2);
}

interface Col {
  label: string;
  w: number;
}
/** Tabela com cabeçalho colorido e linhas para preencher à mão. */
function table(ctx: Ctx, x: number, y: number, w: number, cols: Col[], rows: number, rowH: number, t: Theme, prefill: string[][] = []) {
  const total = cols.reduce((s, c) => s + c.w, 0);
  const headH = 44;
  const h = headH + rows * rowH;
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 14);
  ctx.clip();
  ctx.fillStyle = t.soft;
  ctx.fillRect(x, y, w, headH);
  for (let r = 1; r < rows; r += 2) {
    ctx.fillStyle = t.bg;
    ctx.fillRect(x, y + headH + r * rowH, w, rowH);
  }
  ctx.restore();
  let cx = x;
  cols.forEach((c, i) => {
    const cw = (c.w / total) * w;
    text(ctx, c.label.toUpperCase(), cx + cw / 2, y + 28, { size: 12, weight: 900, color: t.dark, align: 'center', maxWidth: cw - 10, letterSpacing: 0.6 });
    if (i > 0) line(ctx, cx, y, cx, y + h, t.line, 2);
    for (let r = 0; r < rows; r++) {
      const v = prefill[r]?.[i];
      if (v) text(ctx, v, cx + 10, y + headH + r * rowH + rowH / 2 + 7, { size: 17, weight: 700, color: t.ink, maxWidth: cw - 16 });
    }
    cx += cw;
  });
  for (let r = 0; r <= rows; r++) line(ctx, x, y + headH + r * rowH, x + w, y + headH + r * rowH, t.line, 1.5);
  rr(ctx, x, y, w, h, 14);
  ctx.strokeStyle = t.line;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  return y + h;
}

/* ---------- documento ---------- */

export const vacinaDoc: DocDef = {
  id: 'vacina',
  title: 'Carteira de Vacinação',
  file: 'Carteira-de-Vacinacao-do-{nome}',
  pages: [
    {
      id: 'vacina-fora',
      label: 'Lado de fora',
      w: W,
      h: H,
      mm: [297, 210],
      needsQr: true,
      draw(ctx, c, a) {
        const t = theme(c);
        const p = c.pet;
        const ex = p.extras ?? {};
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else background(ctx, t);
        const x5 = 0;
        const x6 = P97;
        const x1 = P97 + P100;

        /* Painel 5 (dobra para dentro, por fora): informações de cuidado */
        {
          const x = x5;
          const w = P97;
          panelTitle(ctx, x, w, 'Informações de cuidado', 'Preencha e mantenha sempre atualizado.', t);
          const ix = x + PAD;
          const iw = w - PAD * 2;
          let y = 250;
          sectionTitle(ctx, ix, y, 'Contatos importantes', t, iw);
          card(ctx, ix, y + 18, iw, 268, t);
          row(ctx, 'Clínica veterinária', ex.vetClinic ?? '', ix + 22, y + 66, iw - 44, t);
          row(ctx, 'Médico(a)-veterinário(a)', ex.vetName ?? '', ix + 22, y + 146, iw - 44, t);
          row(ctx, 'Telefone / emergência', formatPhone(ex.vetPhone), ix + 22, y + 226, iw - 44, t);
          y += 330;
          sectionTitle(ctx, ix, y, 'Atenções e cuidados', t, iw);
          card(ctx, ix, y + 18, iw, 268, t);
          row(ctx, 'Alergias / restrições', ex.allergies ?? '', ix + 22, y + 66, iw - 44, t);
          row(ctx, 'Medicamentos em uso', ex.medications ?? '', ix + 22, y + 146, iw - 44, t);
          row(ctx, 'Cuidados especiais', ex.conditions ?? '', ix + 22, y + 226, iw - 44, t);
          y += 330;
          sectionTitle(ctx, ix, y, 'Em caso de emergência', t, iw);
          card(ctx, ix, y + 18, iw, 188, t);
          const ct = ex.contacts?.[0];
          row(ctx, 'Contato', ct ? [ct.name, ct.relation ? `(${ct.relation})` : ''].filter(Boolean).join(' ') : '', ix + 22, y + 66, iw - 44, t);
          row(ctx, 'Telefone', formatPhone(ct?.phone), ix + 22, y + 146, iw - 44, t);
        }

        /* Painel 6: contracapa */
        {
          const x = x6;
          const w = P100;
          const cx = x + w / 2;
          if (a.logo) drawContain(ctx, a.logo, cx - 120, 70, 240, 220);
          card(ctx, x + PAD, 330, w - PAD * 2, 560, t);
          text(ctx, 'Se me encontrar,', cx, 400, { size: 34, weight: 700, family: 'display', color: t.dark, align: 'center' });
          text(ctx, 'fale com meu tutor', cx, 442, { size: 34, weight: 700, family: 'display', color: t.dark, align: 'center' });
          if (a.qr) {
            ctx.save();
            if (c.preview) ctx.globalAlpha = 0.35;
            ctx.drawImage(a.qr, cx - 130, 480, 260, 260);
            ctx.restore();
          }
          text(ctx, 'Escaneie para ver minha identidade', cx, 778, { size: 18, weight: 700, color: 'rgba(0,0,0,.5)', align: 'center' });
          const phone = formatPhone(p.tutors?.find((tt) => tt.phone)?.phone || c.phone);
          text(ctx, phone || '(__) _____-____', cx, 846, { size: 40, weight: 900, color: t.main, align: 'center', maxWidth: w - PAD * 3 });
          wrap(ctx, 'Para organização pessoal. Não substitui a carteira assinada pelo médico-veterinário.', cx, 990, w - PAD * 3, 26, {
            size: 18,
            weight: 700,
            color: 'rgba(0,0,0,.45)',
            align: 'center',
            maxLines: 3,
          });
          heart(ctx, cx, 1110, 30, t.main);
          text(ctx, 'Kit Identidade Pet · Clube do Focinho', cx, 1170, { size: 17, weight: 700, color: t.dark, align: 'center' });
        }

        /* Painel 1: CAPA */
        {
          const x = x1;
          const w = W - x1;
          const cx = x + w / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, 0, w, H);
          ctx.clip();
          ctx.fillStyle = t.main;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + w, 0);
          ctx.lineTo(x + w, 430);
          ctx.quadraticCurveTo(cx, 560, x, 430);
          ctx.closePath();
          ctx.fill();
          for (const [dx, dy, s, r] of [
            [70, 80, 60, -0.3],
            [w - 80, 120, 70, 0.4],
            [120, 330, 44, 0.2],
            [w - 120, 360, 50, -0.4],
          ] as const)
            paw(ctx, x + dx, dy, s, 'rgba(255,255,255,.14)', r);
          ctx.restore();
          text(ctx, 'CARTEIRA DE', cx, 150, { size: 30, weight: 900, color: 'rgba(255,255,255,.9)', align: 'center', letterSpacing: 6 });
          text(ctx, 'Vacinação', cx, 240, { size: 96, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: w - PAD * 2 });
          photoCircle(ctx, a.photo, p, cx, 620, 190, { ring: 14, ringColor: '#fff', bg: t.soft });
          ctx.beginPath();
          ctx.arc(cx, 620, 212, 0, Math.PI * 2);
          ctx.strokeStyle = t.line;
          ctx.lineWidth = 4;
          ctx.stroke();
          const name = petName(p) === 'seu pet' ? '' : petName(p);
          if (name) text(ctx, name, cx, 910, { size: 84, weight: 700, family: 'display', color: t.ink, align: 'center', maxWidth: w - PAD * 2 });
          else line(ctx, cx - 180, 910, cx + 180, 910, t.line, 3);
          const sub = [getSpecies(p.species)?.label, p.breed].filter(Boolean).join(' · ');
          if (sub) text(ctx, sub, cx, 966, { size: 26, weight: 700, color: 'rgba(0,0,0,.55)', align: 'center', maxWidth: w - PAD * 2 });
          rr(ctx, cx - 170, 1030, 340, 60, 30);
          ctx.fillStyle = t.soft;
          ctx.fill();
          text(ctx, 'Meu cartão de saúde', cx, 1070, { size: 24, weight: 700, family: 'display', color: t.dark, align: 'center' });
          brandLine(ctx, cx - 100, 1180, t);
        }
        foldMarks(ctx, [x6, x1], t);
      },
    },
    {
      id: 'vacina-dentro',
      label: 'Lado de dentro',
      w: W,
      h: H,
      mm: [297, 210],
      draw(ctx, c, a) {
        const t = theme(c);
        const p = c.pet;
        const ex = p.extras ?? {};
        const sp = getSpecies(p.species);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else background(ctx, t);
        const x2 = 0;
        const x3 = P100;
        const x4 = P100 * 2;

        /* Painel 2: identificação */
        {
          const x = x2;
          const w = P100;
          panelTitle(ctx, x, w, 'Identificação', 'Os dados do seu melhor amigo.', t);
          const ix = x + PAD;
          const iw = w - PAD * 2;
          photoBox(ctx, a.photo, p, ix, 230, 170, 210, 16, { border: 5, borderColor: '#fff', bg: t.soft });
          const rx = ix + 200;
          const rw = iw - 200;
          row(ctx, 'Nome', petName(p) === 'seu pet' ? '' : petName(p), rx, 250, rw, t);
          row(ctx, 'Espécie', sp?.label ?? '', rx, 330, rw, t);
          row(ctx, 'Sexo', sexLabel(p), rx, 410, rw, t);
          let y = 500;
          const half = (iw - 24) / 2;
          row(ctx, 'Raça', p.breed ?? '', ix, y, iw, t);
          y += 80;
          row(ctx, p.origin === 'adocao' ? 'Adoção' : 'Nascimento', formatDateBR(p.date), ix, y, half, t);
          row(ctx, 'Idade', ageLabel(p), ix + half + 24, y, half, t);
          y += 80;
          row(ctx, 'Pelagem / sinais', ex.coat ?? '', ix, y, iw, t);
          y += 80;
          row(ctx, 'Porte', ex.size ?? '', ix, y, half, t);
          row(ctx, 'Peso', ex.weight ?? '', ix + half + 24, y, half, t);
          y += 80;
          row(ctx, 'Microchip', ex.microchip ?? '', ix, y, iw, t);
          y += 80;
          row(ctx, 'Tutor(es)', tutorNames(p), ix, y, iw, t);
          y += 80;
          row(ctx, 'Telefone', formatPhone(p.tutors?.find((tt) => tt.phone)?.phone || c.phone), ix, y, half, t);
          row(ctx, 'Cidade / UF', cityOf(p), ix + half + 24, y, half, t);
          y += 80;
          row(ctx, 'Endereço', addressLine(p).replace(` · ${cityOf(p)}`, ''), ix, y, iw, t);
        }

        /* Painel 3: vacinas */
        {
          const x = x3;
          const w = P100;
          const hasV = !!sp?.vaccines.length;
          panelTitle(ctx, x, w, hasV ? 'Registro de vacinas' : 'Consultas e exames', hasV ? 'Anote cada dose, o lote e o próximo reforço.' : 'Anote consultas, exames e retornos.', t);
          const ix = x + PAD;
          const iw = w - PAD * 2;
          let y = 222;
          if (hasV) {
            // vacinas indicadas para a espécie (lembrete)
            let px = ix;
            let py = y;
            for (const v of sp!.vaccines) {
              ctx.font = `800 14px sans-serif`;
              const label = v.split(' (')[0];
              const pw = Math.min(iw, label.length * 8.6 + 28);
              if (px + pw > ix + iw) {
                px = ix;
                py += 38;
              }
              rr(ctx, px, py, pw, 30, 15);
              ctx.fillStyle = t.soft;
              ctx.fill();
              text(ctx, label, px + pw / 2, py + 21, { size: 14, weight: 800, color: t.dark, align: 'center', maxWidth: pw - 12 });
              px += pw + 8;
            }
            y = py + 50;
          }
          const rows = Math.floor((1150 - y - 44) / 60);
          table(
            ctx,
            ix,
            y,
            iw,
            hasV
              ? [
                  { label: 'Data', w: 1.15 },
                  { label: 'Vacina', w: 1.7 },
                  { label: 'Lote', w: 0.95 },
                  { label: 'Próxima', w: 1.15 },
                  { label: 'Carimbo', w: 1.35 },
                ]
              : [
                  { label: 'Data', w: 1.1 },
                  { label: 'Consulta / exame', w: 2.2 },
                  { label: 'Retorno', w: 1.1 },
                  { label: 'Carimbo', w: 1.3 },
                ],
            rows,
            60,
            t,
          );
          text(ctx, 'Peça ao veterinário para registrar e carimbar cada aplicação.', x + w / 2, 1192, { size: 15, weight: 700, color: 'rgba(0,0,0,.45)', align: 'center', maxWidth: iw });
        }

        /* Painel 4 (dobra para dentro, 97 mm): rotina */
        {
          const x = x4;
          const w = P97;
          panelTitle(ctx, x, w, 'Cuidados de rotina', 'Vermífugo, antipulgas e peso em dia.', t);
          const ix = x + PAD;
          const iw = w - PAD * 2;
          const tr = sp?.treatments ?? ['Vermífugo', 'Antipulgas'];
          let y = 250;
          sectionTitle(ctx, ix, y, tr[0] ?? 'Vermífugo', t, iw);
          y = table(ctx, ix, y + 16, iw, [{ label: 'Data', w: 1 }, { label: 'Produto', w: 1.6 }, { label: 'Próxima', w: 1 }], 3, 46, t) + 46;
          sectionTitle(ctx, ix, y, tr[1] ?? 'Antipulgas e carrapatos', t, iw);
          y = table(ctx, ix, y + 16, iw, [{ label: 'Data', w: 1 }, { label: 'Produto', w: 1.6 }, { label: 'Próxima', w: 1 }], 3, 46, t) + 46;
          sectionTitle(ctx, ix, y, 'Controle de peso', t, iw);
          y = table(ctx, ix, y + 16, iw, [{ label: 'Data', w: 1 }, { label: 'Peso', w: 0.9 }, { label: 'Observação', w: 1.7 }], 3, 46, t) + 46;
          sectionTitle(ctx, ix, y, 'Observações', t, iw);
          for (let i = 0; i < 3; i++) line(ctx, ix, y + 48 + i * 40, ix + iw, y + 48 + i * 40, t.line, 2);
        }
        foldMarks(ctx, [x3, x4], t);
      },
    },
  ],
};
