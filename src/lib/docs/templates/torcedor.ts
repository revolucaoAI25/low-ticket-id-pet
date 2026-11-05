'use client';

import { g, petName } from '@/lib/pet';
import { DISCLAIMER, photoCircle } from '../common';
import { drawContain, onColor, paw, rr, star, text } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const W = 1000;
const H = 630;

/** Escudo genérico (time sem escudo ou "não torce"). */
function genericShield(ctx: Ctx, cx: number, cy: number, size: number, fill: string, accent: string, label: string) {
  const w = size * 0.82;
  const h = size;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy - h / 2);
  ctx.lineTo(cx + w / 2, cy + h * 0.05);
  ctx.quadraticCurveTo(cx + w / 2, cy + h * 0.38, cx, cy + h / 2);
  ctx.quadraticCurveTo(cx - w / 2, cy + h * 0.38, cx - w / 2, cy + h * 0.05);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = size * 0.05;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.25;
  for (let i = -3; i < 4; i++) ctx.fillRect(cx + i * w * 0.24 - w * 0.06, cy - h / 2, w * 0.12, h);
  ctx.restore();
  paw(ctx, cx, cy - h * 0.08, size * 0.42, accent);
  const initials = label
    .split(/\s+/)
    .filter((s) => s.length > 2 || /^[A-Z]/.test(s))
    .map((s) => s[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  if (initials) text(ctx, initials, cx, cy + h * 0.3, { size: size * 0.16, weight: 900, color: accent, align: 'center' });
}

export const torcedorDoc: DocDef = {
  id: 'torcedor',
  title: 'Carteirinha de Torcedor',
  file: 'Carteirinha-de-Torcedor-do-{nome}',
  pages: [
    {
      id: 'torcedor',
      label: 'Carteirinha',
      w: W,
      h: H,
      mm: [85.6, 54],
      needsCrest: true,
      draw(ctx, c, a) {
        const p = c.pet;
        const choice = p.team;
        const team = c.team;
        const none = !choice || choice.none;
        const primary = team?.primary ?? (none ? '#6F2A7A' : '#2F4858');
        const secondary = team?.secondary ?? (none ? '#F5A524' : '#F5A524');
        const fg = onColor(primary);
        const teamName = none ? (p.tutors?.[0]?.name ? `Família ${p.tutors[0].name.trim().split(' ').pop()}` : 'Família') : team?.short ?? choice?.name ?? '';

        ctx.save();
        rr(ctx, 0, 0, W, H, 40);
        ctx.clip();
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = primary;
          ctx.fillRect(0, 0, W, H);
          // listras diagonais
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = secondary === primary ? '#fff' : secondary;
          ctx.translate(W * 0.55, 0);
          ctx.rotate(0.35);
          for (let i = 0; i < 6; i++) ctx.fillRect(i * 110, -200, 50, H + 400);
          ctx.restore();
          // faixa inferior
          ctx.fillStyle = 'rgba(0,0,0,.28)';
          ctx.fillRect(0, H - 70, W, 70);
        }
        ctx.restore();

        // Escudo
        ctx.beginPath();
        ctx.arc(170, 250, 132, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = secondary;
        ctx.stroke();
        if (a.crest) drawContain(ctx, a.crest, 70, 150, 200, 200);
        else genericShield(ctx, 170, 250, 190, primary, secondary === primary ? '#fff' : secondary, teamName);

        text(ctx, 'CARTEIRINHA DE TORCEDOR', 330, 104, { size: 22, weight: 900, color: fg, letterSpacing: 2, maxWidth: 380 });
        text(ctx, g(p, 'Torcedor oficial', 'Torcedora oficial'), 330, 158, { size: 40, weight: 700, family: 'display', color: fg, maxWidth: 400 });
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        text(ctx, name || '________', 330, 250, { size: 76, weight: 700, family: 'display', color: fg, maxWidth: 400 });
        // selo Fã nº 1
        rr(ctx, 330, 285, 290, 64, 32);
        ctx.fillStyle = secondary === primary ? '#F5A524' : secondary;
        ctx.fill();
        const badgeFg = onColor(secondary === primary ? '#F5A524' : secondary);
        star(ctx, 362, 317, 15, badgeFg);
        text(ctx, 'FÃ Nº 1', 488, 330, { size: 36, weight: 900, color: badgeFg, align: 'center', letterSpacing: 2 });
        text(ctx, none ? teamName : `do ${teamName}`, 330, 400, { size: 32, weight: 800, color: fg, maxWidth: 400 });

        // Foto
        photoCircle(ctx, a.photo, p, 845, 250, 118, { ring: 8, ringColor: '#fff' });

        const year = p.date ? p.date.slice(0, 4) : String(new Date().getFullYear());
        text(ctx, `Sócio-pet desde ${year}`, 60, H - 26, { size: 24, weight: 800, color: '#fff' });
        text(ctx, 'Nº 000001', W - 60, H - 26, { size: 24, weight: 800, color: '#fff', align: 'right' });
        text(ctx, DISCLAIMER, W / 2, H - 86, { size: 15, weight: 700, color: fg === '#FFFFFF' ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.5)', align: 'center' });
      },
    },
  ],
};
