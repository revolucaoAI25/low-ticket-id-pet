'use client';

import { ageYears, doPet, g, petName } from '@/lib/pet';
import { photoCircle } from '../common';
import { confetti, dashedRect, heart, line, paw, rr, star, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const PARTY = ['#E9A092', '#F5A524', '#6F2A7A', '#A9BAA6', '#E8833A', '#7FB7E6'];
const ROXO = '#6F2A7A';

function bunting(ctx: Ctx, x: number, y: number, w: number, n: number) {
  const step = w / n;
  ctx.strokeStyle = 'rgba(73,56,47,.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + w / 2, y + 40, x + w, y);
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const px = x + w * t;
    const py = y + 40 * 2 * t * (1 - t) * 1.0 + 2;
    ctx.beginPath();
    ctx.moveTo(px - step * 0.38, py);
    ctx.lineTo(px + step * 0.38, py);
    ctx.lineTo(px, py + step * 0.8);
    ctx.closePath();
    ctx.fillStyle = PARTY[i % PARTY.length];
    ctx.fill();
  }
}

/** Idade que vai ser comemorada (a próxima). Para adotados, conta os anos de família. */
function ageText(p: Parameters<typeof petName>[0]): string {
  const a = ageYears(p.date);
  if (a === null) return '';
  const n = a + 1;
  if (p.origin === 'adocao') return `${n} ${n === 1 ? 'ano' : 'anos'} de família`;
  return n === 1 ? 'Meu primeiro aninho!' : `${n} aninhos`;
}

function partyTitle(p: Parameters<typeof petName>[0]): string {
  return p.origin === 'adocao' ? 'ANIVERSÁRIO DE ADOÇÃO' : 'ANIVERSÁRIO';
}

export const aniversarioDoc: DocDef = {
  id: 'aniversario',
  title: 'Kit Aniversário',
  file: 'Kit-Aniversario-do-{nome}',
  pages: [
    {
      id: 'aniv-convite',
      label: 'Convite',
      w: 1000,
      h: 1400,
      mm: [148, 207],
      draw(ctx, c, a) {
        const W = 1000;
        const H = 1400;
        const p = c.pet;
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFF4E8';
          ctx.fillRect(0, 0, W, H);
          confetti(ctx, 0, 0, W, H, PARTY, 70, 11);
          bunting(ctx, -20, 40, W + 40, 11);
          rr(ctx, 50, 170, W - 100, H - 220, 40);
          ctx.fillStyle = 'rgba(255,250,243,.94)';
          ctx.fill();
        }
        text(ctx, 'Vem comemorar comigo!', W / 2, 250, { size: 56, weight: 700, family: 'display', color: ROXO, align: 'center', maxWidth: W - 120 });
        photoCircle(ctx, a.photo, p, W / 2, 520, 210, { ring: 16, ringColor: '#F5A524' });
        text(ctx, partyTitle(p), W / 2, 820, { size: 36, weight: 900, color: '#E8833A', align: 'center', letterSpacing: 5, maxWidth: W - 160 });
        text(ctx, name ? doPet(p) : 'do meu pet', W / 2, 920, { size: 92, weight: 700, family: 'display', color: '#3a2a22', align: 'center', maxWidth: W - 120 });
        const age = ageText(p);
        if (age) text(ctx, age, W / 2, 990, { size: 40, weight: 700, family: 'display', color: ROXO, align: 'center' });
        const fields = ['Dia', 'Hora', 'Local'];
        fields.forEach((f, i) => {
          const y = 1090 + i * 80;
          text(ctx, f.toUpperCase(), 160, y, { size: 24, weight: 900, color: ROXO, letterSpacing: 2 });
          line(ctx, 290, y + 6, W - 160, y + 6, 'rgba(73,56,47,.3)', 3, [2, 8]);
        });
        text(ctx, 'Traga seu pet, petiscos e muito carinho!', W / 2, 1340, { size: 28, weight: 700, color: 'rgba(73,56,47,.7)', align: 'center' });
      },
    },
    {
      id: 'aniv-topo',
      label: 'Topo de bolo',
      w: 1240,
      h: 1754,
      mm: [210, 297],
      draw(ctx, c, a) {
        const W = 1240;
        const H = 1754;
        const p = c.pet;
        const name = petName(p) === 'seu pet' ? 'Parabéns!' : petName(p);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        text(ctx, 'Topo de bolo e toppers — recorte na linha pontilhada e cole num palito', W / 2, 90, { size: 26, weight: 700, color: 'rgba(73,56,47,.6)', align: 'center' });
        // topo grande
        const cx = W / 2;
        const cy = 520;
        ctx.beginPath();
        ctx.arc(cx, cy, 380, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF4E8';
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 380, 0, Math.PI * 2);
        ctx.clip();
        confetti(ctx, cx - 380, cy - 380, 760, 760, PARTY, 50, 3);
        ctx.restore();
        ctx.save();
        ctx.setLineDash([12, 10]);
        ctx.strokeStyle = 'rgba(73,56,47,.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 392, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        photoCircle(ctx, a.photo, p, cx, cy - 70, 190, { ring: 12, ringColor: '#F5A524' });
        rr(ctx, cx - 300, cy + 150, 600, 120, 60);
        ctx.fillStyle = ROXO;
        ctx.fill();
        text(ctx, name, cx, cy + 232, { size: 80, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: 540 });
        const age = ageText(p);
        text(ctx, age || 'Feliz aniversário!', cx, cy + 330, { size: 40, weight: 700, family: 'display', color: ROXO, align: 'center' });
        // toppers pequenos
        const small = [
          [250, 1220],
          [620, 1220],
          [990, 1220],
          [250, 1560],
          [620, 1560],
          [990, 1560],
        ];
        small.forEach(([x, y], i) => {
          ctx.save();
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = 'rgba(73,56,47,.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 150, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          if (i % 2 === 0) photoCircle(ctx, a.photo, p, x, y, 135, { ring: 8, ringColor: PARTY[i % PARTY.length] });
          else {
            ctx.beginPath();
            ctx.arc(x, y, 140, 0, Math.PI * 2);
            ctx.fillStyle = PARTY[i % PARTY.length];
            ctx.fill();
            paw(ctx, x, y - 30, 90, 'rgba(255,255,255,.9)');
            text(ctx, i === 1 ? 'Parabéns!' : i === 3 ? 'Eba!' : 'Festa!', x, y + 70, { size: 40, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: 230 });
          }
        });
      },
    },
    {
      id: 'aniv-plaquinhas',
      label: 'Plaquinhas',
      w: 1240,
      h: 1754,
      mm: [210, 297],
      draw(ctx, c) {
        const W = 1240;
        const p = c.pet;
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, 1754);
        text(ctx, 'Plaquinhas para fotos — recorte e cole num palito', W / 2, 90, { size: 26, weight: 700, color: 'rgba(73,56,47,.6)', align: 'center' });
        const signs = [
          name ? `Parabéns, ${name}!` : 'Parabéns!',
          'Hoje tem bolo!',
          `${g(p, 'O', 'A')} mais ${g(p, 'lindo', 'linda')} da festa`,
          'Melhor pet do mundo',
          name ? `Festa ${doPet(p)}` : 'Festa do pet',
          'Cadê meu presente?',
        ];
        signs.forEach((s, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = 80 + col * 560;
          const y = 160 + row * 520;
          const color = PARTY[(i + 2) % PARTY.length];
          dashedRect(ctx, x - 14, y - 14, 528, 468, 34, 'rgba(73,56,47,.35)', 2, [8, 8]);
          rr(ctx, x, y, 500, 440, 28);
          ctx.fillStyle = color;
          ctx.fill();
          confetti(ctx, x + 10, y + 10, 480, 120, ['rgba(255,255,255,.45)'], 10, i + 5);
          paw(ctx, x + 250, y + 120, 80, 'rgba(255,255,255,.85)', (i - 2) * 0.15);
          wrap(ctx, s, x + 250, y + 260, 440, 70, { size: 60, weight: 700, family: 'display', color: '#fff', align: 'center', maxLines: 2 });
        });
      },
    },
    {
      id: 'aniv-certificado',
      label: 'Certificado',
      w: 1754,
      h: 1240,
      mm: [297, 210],
      draw(ctx, c, a) {
        const W = 1754;
        const H = 1240;
        const p = c.pet;
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFFBF4';
          ctx.fillRect(0, 0, W, H);
          ctx.lineWidth = 16;
          ctx.strokeStyle = '#F5A524';
          rr(ctx, 50, 50, W - 100, H - 100, 40);
          ctx.stroke();
          ctx.lineWidth = 3;
          ctx.strokeStyle = ROXO;
          rr(ctx, 86, 86, W - 172, H - 172, 26);
          ctx.stroke();
          confetti(ctx, 100, 100, W - 200, 160, PARTY, 30, 21);
        }
        text(ctx, 'CERTIFICADO', W / 2, 300, { size: 110, weight: 700, family: 'display', color: ROXO, align: 'center', letterSpacing: 8 });
        text(ctx, 'de Melhor Pet do Mundo', W / 2, 380, { size: 56, weight: 600, family: 'display', color: '#E8833A', align: 'center' });
        photoCircle(ctx, a.photo, p, 330, 720, 180, { ring: 12, ringColor: '#F5A524' });
        text(ctx, 'Conferido com todo o amor a', 520, 560, { size: 38, weight: 700, color: 'rgba(73,56,47,.7)' });
        text(ctx, name || '____________', 520, 680, { size: 110, weight: 700, family: 'display', color: '#3a2a22', maxWidth: W - 640 });
        wrap(
          ctx,
          `por ser ${g(p, 'o', 'a')} ${g(p, 'companheiro', 'companheira')} mais ${g(p, 'fiel', 'fiel')}, ${g(p, 'divertido', 'divertida')} e ${g(p, 'amado', 'amada')} que uma família poderia ter. Que venham muitos aniversários!`,
          520,
          770,
          W - 680,
          56,
          { size: 38, weight: 600, color: '#49382F', maxLines: 3 },
        );
        line(ctx, 520, 1030, 900, 1030, 'rgba(73,56,47,.4)', 2);
        text(ctx, 'Tutores', 710, 1070, { size: 28, weight: 700, color: '#8a7566', align: 'center' });
        line(ctx, 1000, 1030, 1380, 1030, 'rgba(73,56,47,.4)', 2);
        text(ctx, 'Data', 1190, 1070, { size: 28, weight: 700, color: '#8a7566', align: 'center' });
        heart(ctx, 1520, 1010, 70, '#E9A092');
        star(ctx, 1460, 960, 18, '#F5A524');
        star(ctx, 1580, 950, 14, '#F5A524');
      },
    },
  ],
};
