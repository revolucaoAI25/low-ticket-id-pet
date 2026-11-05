'use client';

import { ageLabel, doPet, personalityLabel, petName } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { formatPhone, photoCircle } from '../common';
import { line, paw, pawPattern, rr, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const W = 1240;
const H = 1754;
const ROXO = '#6F2A7A';
const CORAL = '#E9A092';

function box(ctx: Ctx, x: number, y: number, w: number, h: number, title: string, emoji: string, value: string, lines: number) {
  rr(ctx, x, y, w, h, 24);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#EADBC8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = `34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(emoji, x + 24, y + 54);
  text(ctx, title, x + 76, y + 52, { size: 32, weight: 700, family: 'display', color: ROXO, maxWidth: w - 100 });
  const top = y + 100;
  const gap = (h - 120) / lines;
  if (value) wrap(ctx, value, x + 28, top + 4, w - 56, gap, { size: 27, weight: 700, color: '#49382F', maxLines: lines });
  for (let i = 0; i < lines; i++) line(ctx, x + 28, top + 16 + i * gap, x + w - 28, top + 16 + i * gap, 'rgba(73,56,47,.16)', 2);
}

export const quemCuidaDoc: DocDef = {
  id: 'quemcuida',
  title: 'Kit Quem Cuida',
  file: 'Quem-Cuida-do-{nome}',
  pages: [
    {
      id: 'quemcuida',
      label: 'Ficha de rotina',
      w: W,
      h: H,
      mm: [210, 297],
      draw(ctx, c, a) {
        const p = c.pet;
        const ex = p.extras ?? {};
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFF8EF';
          ctx.fillRect(0, 0, W, H);
          pawPattern(ctx, 0, 0, W, H, 'rgba(233,160,146,.12)', 160, 50);
          ctx.fillStyle = ROXO;
          ctx.fillRect(0, 0, W, 300);
        }
        photoCircle(ctx, a.photo, p, 190, 230, 130, { ring: 10, ringColor: '#F5A524' });
        text(ctx, 'QUEM CUIDA', 360, 120, { size: 34, weight: 900, color: '#F2C46B', letterSpacing: 6 });
        text(ctx, petName(p) === 'seu pet' ? 'do meu pet' : doPet(p), 360, 200, { size: 84, weight: 700, family: 'display', color: '#fff', maxWidth: W - 420 });
        text(ctx, 'Tudo o que você precisa saber pra cuidar de mim ♥', 360, 252, { size: 28, weight: 700, color: 'rgba(255,255,255,.85)', maxWidth: W - 420 });

        // Fatos rápidos
        const facts = [
          getSpecies(p.species)?.label,
          p.breed,
          ageLabel(p) || undefined,
          personalityLabel(p),
          ex.weight ? `${ex.weight}` : undefined,
        ].filter(Boolean) as string[];
        let fx = 360;
        ctx.font = `800 24px sans-serif`;
        for (const f of facts) {
          text(ctx, f, 0, -100, { size: 24, weight: 800 });
          const tw = ctx.measureText(f).width + 40;
          if (fx + tw > W - 40) break;
          rr(ctx, fx, 330, tw, 48, 24);
          ctx.fillStyle = '#F6E9DA';
          ctx.fill();
          text(ctx, f, fx + 20, 363, { size: 24, weight: 800, color: '#49382F' });
          fx += tw + 12;
        }

        const col = (W - 80 * 2 - 30) / 2;
        const x1 = 80;
        const x2 = 80 + col + 30;
        box(ctx, x1, 420, col, 300, 'Alimentação', '🍽️', [ex.food, ex.feedingTimes].filter(Boolean).join(' · '), 4);
        box(ctx, x2, 420, col, 300, 'Passeios e brincadeiras', '🎾', ex.walks ?? '', 4);
        box(ctx, x1, 750, col, 260, 'Remédios', '💊', ex.medications ?? '', 3);
        box(ctx, x2, 750, col, 260, 'Alergias e saúde', '🩺', [ex.allergies, ex.conditions].filter(Boolean).join(' · '), 3);
        box(ctx, x1, 1040, col, 260, 'Manias e o que eu amo', '🥰', ex.habits ?? '', 3);
        box(ctx, x2, 1040, col, 260, 'O que eu NÃO posso', '🚫', ex.forbidden ?? '', 3);

        // Contatos
        rr(ctx, 80, 1330, W - 160, 340, 24);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = CORAL;
        ctx.lineWidth = 4;
        ctx.stroke();
        text(ctx, 'Em caso de emergência', 112, 1390, { size: 36, weight: 700, family: 'display', color: '#C2410C' });
        const contacts: [string, string][] = [];
        if (p.tutors || c.phone) contacts.push([`Tutores: ${p.tutors ?? ''}`, formatPhone(c.phone)]);
        for (const ct of ex.contacts ?? []) contacts.push([`${ct.name}${ct.relation ? ` (${ct.relation})` : ''}`, formatPhone(ct.phone)]);
        if (ex.vetName || ex.vetClinic || ex.vetPhone) contacts.push([`Veterinário: ${[ex.vetName, ex.vetClinic].filter(Boolean).join(' · ')}`, formatPhone(ex.vetPhone)]);
        while (contacts.length < 4) contacts.push(['', '']);
        contacts.slice(0, 4).forEach(([n, ph], i) => {
          const y = 1460 + i * 54;
          if (n) text(ctx, n, 112, y, { size: 27, weight: 700, color: '#49382F', maxWidth: 640 });
          if (ph) text(ctx, ph, W - 112, y, { size: 27, weight: 900, color: ROXO, align: 'right' });
          line(ctx, 112, y + 14, W - 112, y + 14, 'rgba(73,56,47,.14)', 2);
        });
        paw(ctx, W - 130, 1380, 50, 'rgba(233,160,146,.5)', 0.3);
        text(ctx, 'Clube do Focinho · Kit Identidade Pet', W / 2, H - 40, { size: 22, weight: 700, color: 'rgba(73,56,47,.45)', align: 'center' });
      },
    },
  ],
};
