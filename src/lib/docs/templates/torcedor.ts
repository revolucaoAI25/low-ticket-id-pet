'use client';

/**
 * Carteirinha de Torcedor: NÃO usa template de imagem. É montada aqui, com as cores e o escudo do time
 * escolhido no quiz (ou um escudo do Clube para quem não torce / time sem escudo).
 */

import { formatDateBR, g, isFemale, petName, tutorNames, type PetData, type Personality } from '@/lib/pet';
import { photoCircle } from '../common';
import { drawContain, line, luminance, onColor, paw, rr, star, text } from '../draw';
import type { Ctx } from '../draw';
import type { DocContext, DocDef } from '../types';

const W = 1000;
const H = 630;

const POSITION: Record<Personality, { m: string; f: string }> = {
  aventureiro: { m: 'Atacante', f: 'Atacante' },
  dorminhoco: { m: 'Goleiro (debaixo das cobertas)', f: 'Goleira (debaixo das cobertas)' },
  comilao: { m: 'Volante da cozinha', f: 'Volante da cozinha' },
  brincalhao: { m: 'Meia-armador', f: 'Meia-armadora' },
  grudinho: { m: 'Zagueiro (marca o tutor)', f: 'Zagueira (marca o tutor)' },
};

const CELEBRATION: Record<Personality, string> = {
  aventureiro: 'Volta olímpica no quintal',
  dorminhoco: 'Abre um olho e volta a dormir',
  comilao: 'Exige petisco de comemoração',
  brincalhao: 'Corre atrás do próprio rabo',
  grudinho: 'Pula no colo do tutor',
};

function shade(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

interface Colors {
  primary: string;
  /** Cor de destaque que contrasta com o fundo. */
  accent: string;
  fg: string;
  teamLabel: string;
  none: boolean;
}

function colors(c: DocContext): Colors {
  const p = c.pet;
  const none = !p.team || !!p.team.none;
  if (none) return { primary: '#6F2A7A', accent: '#F5A524', fg: '#FFFFFF', teamLabel: 'Torcida da família', none };
  const team = c.team;
  const primary = team?.primary ?? '#2F4858';
  let accent = team?.secondary ?? '#F5A524';
  // Se o secundário não contrasta com o primário (ex.: preto e preto), usa branco ou dourado.
  if (Math.abs(luminance(accent) - luminance(primary)) < 0.25) accent = luminance(primary) < 0.4 ? '#FFFFFF' : '#1d1d1d';
  return { primary, accent, fg: onColor(primary), teamLabel: team?.short ?? p.team?.name ?? '', none };
}

/** Escudo do Clube (time sem escudo cadastrado ou "não torce"). */
function clubShield(ctx: Ctx, cx: number, cy: number, size: number, fill: string, accent: string, label: string) {
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
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = accent;
  for (let i = -3; i < 4; i++) ctx.fillRect(cx + i * w * 0.24 - w * 0.06, cy - h / 2, w * 0.12, h);
  ctx.restore();
  paw(ctx, cx, cy - h * 0.08, size * 0.42, accent);
  const initials = label
    .split(/\s+/)
    .filter((s) => s.length > 2)
    .map((s) => s[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  if (initials) text(ctx, initials, cx, cy + h * 0.3, { size: size * 0.15, weight: 900, color: accent, align: 'center' });
}

function crest(ctx: Ctx, a: { crest: HTMLImageElement | null }, cl: Colors, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.25)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.07;
  ctx.strokeStyle = cl.accent === '#FFFFFF' ? '#E9E3D8' : cl.accent;
  ctx.stroke();
  if (a.crest) drawContain(ctx, a.crest, cx - r * 0.72, cy - r * 0.72, r * 1.44, r * 1.44);
  else clubShield(ctx, cx, cy, r * 1.35, cl.primary, cl.accent === '#FFFFFF' ? '#F5A524' : cl.accent, cl.teamLabel);
}

/** Camisa do time com o nome e o número 1 nas costas. */
function jersey(ctx: Ctx, x: number, y: number, s: number, cl: Colors, name: string) {
  const P = (px: number, py: number): [number, number] => [x + px * s, y + py * s];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...P(110, 0));
  ctx.quadraticCurveTo(...P(150, 34), ...P(190, 0));
  ctx.lineTo(...P(245, 12));
  ctx.lineTo(...P(300, 72));
  ctx.lineTo(...P(262, 122));
  ctx.lineTo(...P(238, 102));
  ctx.lineTo(...P(238, 372));
  ctx.quadraticCurveTo(...P(150, 384), ...P(62, 372));
  ctx.lineTo(...P(62, 102));
  ctx.lineTo(...P(38, 122));
  ctx.lineTo(...P(0, 72));
  ctx.lineTo(...P(55, 12));
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,.18)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  const grad = ctx.createLinearGradient(x, y, x + 300 * s, y + 380 * s);
  grad.addColorStop(0, shade(cl.primary, 0.12));
  grad.addColorStop(1, shade(cl.primary, -0.15));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  // punhos e barra
  ctx.fillStyle = cl.accent;
  ctx.save();
  ctx.translate(...P(19, 97));
  ctx.rotate(0.92);
  ctx.fillRect(-40 * s, -9 * s, 80 * s, 18 * s);
  ctx.restore();
  ctx.save();
  ctx.translate(...P(281, 97));
  ctx.rotate(-0.92);
  ctx.fillRect(-40 * s, -9 * s, 80 * s, 18 * s);
  ctx.restore();
  ctx.restore();
  // gola
  ctx.beginPath();
  ctx.moveTo(...P(110, 0));
  ctx.quadraticCurveTo(...P(150, 34), ...P(190, 0));
  ctx.lineWidth = 10 * s;
  ctx.strokeStyle = cl.accent;
  ctx.stroke();
  const ink = cl.accent;
  text(ctx, name.toUpperCase(), x + 150 * s, y + 118 * s, { size: 34 * s, weight: 900, color: ink, align: 'center', maxWidth: 160 * s, letterSpacing: 2 * s, family: 'display' });
  text(ctx, '1', x + 150 * s, y + 300 * s, { size: 170 * s, weight: 700, color: ink, align: 'center', family: 'display' });
}

function cardClip(ctx: Ctx) {
  rr(ctx, 0, 0, W, H, 36);
  ctx.clip();
}

export const torcedorDoc: DocDef = {
  id: 'torcedor',
  title: 'Carteirinha de Torcedor',
  file: 'Carteirinha-de-Torcedor-do-{nome}',
  pages: [
    {
      id: 'torcedor-frente',
      label: 'Frente',
      w: W,
      h: H,
      mm: [85.6, 54],
      needsCrest: true,
      draw(ctx, c, a) {
        const p = c.pet;
        const cl = colors(c);
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        ctx.save();
        cardClip(ctx);
        const bg = ctx.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, shade(cl.primary, 0.1));
        bg.addColorStop(1, shade(cl.primary, -0.35));
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        // faixa diagonal na cor do time
        ctx.save();
        ctx.translate(W * 0.88, 0);
        ctx.rotate(0.32);
        ctx.fillStyle = cl.accent;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(0, -100, 46, H + 300);
        ctx.globalAlpha = 0.35;
        ctx.fillRect(66, -100, 14, H + 300);
        ctx.restore();
        // brilho
        const shine = ctx.createRadialGradient(W * 0.2, 0, 10, W * 0.2, 0, W * 0.8);
        shine.addColorStop(0, 'rgba(255,255,255,.18)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, W, H);
        // rodapé
        ctx.fillStyle = 'rgba(0,0,0,.32)';
        ctx.fillRect(0, H - 84, W, 84);
        ctx.restore();

        text(ctx, 'SÓCIO-TORCEDOR PET', 60, 78, { size: 24, weight: 900, color: cl.fg, letterSpacing: 4 });
        text(ctx, 'CLUBE DO FOCINHO', W - 60, 78, { size: 20, weight: 800, color: cl.fg === '#FFFFFF' ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.6)', align: 'right', letterSpacing: 3 });

        crest(ctx, a, cl, 165, 300, 112);

        text(ctx, g(p, 'TORCEDOR OFICIAL', 'TORCEDORA OFICIAL'), 315, 200, { size: 24, weight: 900, color: cl.fg, letterSpacing: 2, maxWidth: 330 });
        text(ctx, name || '________', 315, 285, { size: 82, weight: 700, family: 'display', color: cl.fg, maxWidth: 340, minSize: 40 });
        // selo Fã nº 1
        rr(ctx, 315, 315, 250, 62, 31);
        ctx.fillStyle = cl.accent;
        ctx.fill();
        const badgeFg = onColor(cl.accent);
        star(ctx, 348, 346, 15, badgeFg);
        text(ctx, 'FÃ Nº 1', 455, 359, { size: 34, weight: 900, color: badgeFg, align: 'center', letterSpacing: 2 });
        text(ctx, cl.none ? cl.teamLabel : `do ${cl.teamLabel}`, 315, 425, { size: 30, weight: 800, color: cl.fg, maxWidth: 340 });

        photoCircle(ctx, a.photo, p, 830, 300, 118, { ring: 9, ringColor: cl.accent === '#FFFFFF' ? '#fff' : cl.accent });

        const year = p.date ? p.date.slice(0, 4) : String(new Date().getFullYear());
        text(ctx, `SÓCIO DESDE ${year}`, 60, H - 32, { size: 22, weight: 900, color: '#fff', letterSpacing: 2 });
        for (let i = 0; i < 5; i++) star(ctx, W / 2 - 60 + i * 30, H - 41, 11, '#F5C842');
        text(ctx, 'CATEGORIA OURO', W - 60, H - 32, { size: 22, weight: 900, color: '#F5C842', align: 'right', letterSpacing: 2 });
      },
    },
    {
      id: 'torcedor-verso',
      label: 'Verso',
      w: W,
      h: H,
      mm: [85.6, 54],
      needsCrest: true,
      draw(ctx, c, a) {
        const p: PetData = c.pet;
        const cl = colors(c);
        const name = petName(p) === 'seu pet' ? 'PET' : petName(p);
        ctx.save();
        cardClip(ctx);
        ctx.fillStyle = '#FAF7F2';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = cl.primary;
        ctx.fillRect(0, 0, W, 92);
        ctx.fillStyle = cl.accent;
        ctx.fillRect(0, 92, W, 8);
        ctx.restore();
        text(ctx, 'FICHA TÉCNICA', 50, 62, { size: 34, weight: 900, color: cl.fg, letterSpacing: 4 });
        text(ctx, cl.none ? cl.teamLabel : cl.teamLabel.toUpperCase(), W - 130, 60, { size: 24, weight: 900, color: cl.fg, align: 'right', letterSpacing: 2, maxWidth: 400 });
        if (a.crest) drawContain(ctx, a.crest, W - 112, 14, 64, 64);
        else paw(ctx, W - 80, 48, 50, cl.accent);

        jersey(ctx, 46, 140, 0.98, cl, name);

        const x = 390;
        const w = W - x - 50;
        const row = (label: string, value: string, y: number) => {
          text(ctx, label, x, y, { size: 16, weight: 900, color: shade(cl.primary, -0.1), letterSpacing: 1.5, maxWidth: w });
          text(ctx, value, x, y + 34, { size: 26, weight: 800, color: '#2a2320', maxWidth: w });
          line(ctx, x, y + 48, x + w, y + 48, 'rgba(0,0,0,.1)', 2);
        };
        const pers = p.personality;
        row('POSIÇÃO', pers ? (isFemale(p) ? POSITION[pers].f : POSITION[pers].m) : 'Craque do time', 145);
        row('CAMISA', 'Nº 1 da família', 225);
        row(p.origin === 'adocao' ? 'ESTREIA NA FAMÍLIA' : 'NASCIMENTO', formatDateBR(p.date) || '___/___/_____', 305);
        row('COMEMORAÇÃO DE GOL', pers ? CELEBRATION[pers] : 'Late pra torcida toda', 385);
        row('JOGOS ASSISTIDOS NO SOFÁ', 'Todos (e mais alguns)', 465);

        // assinatura + código de barras decorativo
        const tutors = tutorNames(p);
        line(ctx, 50, 585, 330, 585, '#2a2320', 2);
        text(ctx, tutors ? `Assinatura: ${tutors}` : 'Assinatura do tutor', 50, 612, { size: 15, weight: 700, color: 'rgba(42,35,32,.6)', maxWidth: 290 });
        let bx = x;
        let seed = (name.length * 7919) % 97;
        while (bx < W - 50) {
          seed = (seed * 31 + 7) % 101;
          const bw = 2 + (seed % 4);
          ctx.fillStyle = '#2a2320';
          ctx.fillRect(bx, 548, bw, 44);
          bx += bw + 2 + (seed % 3);
        }
        text(ctx, 'Uso pessoal · sem vínculo com o clube', x + w / 2, 612, { size: 14, weight: 700, color: 'rgba(42,35,32,.55)', align: 'center' });
      },
    },
  ],
};
