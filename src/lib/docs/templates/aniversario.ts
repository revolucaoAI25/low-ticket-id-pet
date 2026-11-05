'use client';

/**
 * Kit Aniversário (bônus). Montado em código: usa a cor favorita e as fotos extras do formulário de confirmação.
 */

import { ageYears, doPet, g, petName, tutorNames, type PetData } from '@/lib/pet';
import { photoCircle } from '../common';
import { FONT_DISPLAY, heart, line, paw, rr, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import { arcText, balloon, balloonCluster, bunting, cake, confettiFancy, gift, laurel, palette, partyHat, ribbon, rosette, scallop, seed, sparkle, starBurst } from '../party';
import type { Assets, DocDef } from '../types';

const pal = (p: PetData) => palette(p.extras?.favoriteColor || '#E8789E');
/** Foto extra i (ou a principal). */
const pic = (a: Assets, i: number) => (a.photos.length ? a.photos[i % a.photos.length] : a.photo);

/** Idade que vai ser comemorada (a próxima). Para adotados, conta os anos de família. */
function nextAge(p: PetData): number | null {
  const a = ageYears(p.date);
  return a === null ? null : a + 1;
}
function ageLine(p: PetData): string {
  const n = nextAge(p);
  if (n === null) return '';
  if (p.origin === 'adocao') return `${n} ${n === 1 ? 'ano' : 'anos'} de família`;
  return n === 1 ? 'meu primeiro aninho' : `${n} aninhos`;
}

/** Foto com chapéu de festa por cima. */
function partyPhoto(ctx: Ctx, img: HTMLImageElement | null, p: PetData, cx: number, cy: number, r: number, c: ReturnType<typeof palette>, hat = true) {
  scallop(ctx, cx, cy, r * 1.16, 26, c.main);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.06, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  photoCircle(ctx, img, p, cx, cy, r);
  if (hat) partyHat(ctx, cx + r * 0.7, cy - r * 0.66, r * 0.44, r * 0.54, c.gold, '#fff', 0.5);
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
      draw(ctx, cc, a) {
        const W = 1000;
        const H = 1400;
        const p = cc.pet;
        const c = pal(p);
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        seed(name.length + 3);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, c.light);
          bg.addColorStop(1, c.cream);
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
          confettiFancy(ctx, 0, 0, W, H, c.mix, 90, 1.3, { x: 90, y: 260, w: W - 180, h: H - 360 });
          bunting(ctx, -30, 36, W + 30, 70, c.mix, 70);
          balloonCluster(ctx, 120, 250, 180, c.mix);
          balloonCluster(ctx, W - 120, 270, 170, [...c.mix].reverse(), true);
        }
        // cartão central
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.12)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        rr(ctx, 110, 330, W - 220, H - 420, 48);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.setLineDash([2, 14]);
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = c.main;
        rr(ctx, 135, 355, W - 270, H - 470, 36);
        ctx.stroke();
        ctx.restore();

        text(ctx, 'VEM PRA MINHA FESTA!', W / 2, 418, { size: 40, weight: 900, color: c.dark, align: 'center', letterSpacing: 4 });
        partyPhoto(ctx, a.photo, p, W / 2, 660, 165, c);
        ribbon(ctx, W / 2, 885, 620, 104, c.main, name ? `Aniversário ${doPet(p)}` : 'Aniversário do meu pet');
        const n = nextAge(p);
        if (n !== null) {
          starBurst(ctx, W / 2 + 330, 660, 92, c.gold, 16);
          text(ctx, String(n), W / 2 + 330, 688, { size: 86, weight: 700, family: 'display', color: '#fff', align: 'center' });
          text(ctx, p.origin === 'adocao' ? `${n === 1 ? 'ano' : 'anos'} de família` : n === 1 ? 'aninho' : 'aninhos', W / 2 + 330, 780, {
            size: 26,
            weight: 900,
            color: c.dark,
            align: 'center',
            maxWidth: 200,
          });
        }
        const rows: [string, string][] = [
          ['DIA', '____ / ____'],
          ['HORA', '______ h'],
          ['LOCAL', ''],
        ];
        rows.forEach(([k, v], i) => {
          const y = 1010 + i * 78;
          rr(ctx, 210, y - 40, 120, 52, 26);
          ctx.fillStyle = c.light;
          ctx.fill();
          text(ctx, k, 270, y - 5, { size: 22, weight: 900, color: c.dark, align: 'center', letterSpacing: 1 });
          line(ctx, 350, y + 4, W - 210, y + 4, 'rgba(73,56,47,.25)', 3, [2, 9]);
          if (v) text(ctx, v, 360, y - 6, { size: 26, weight: 700, color: 'rgba(73,56,47,.35)' });
        });
        text(ctx, 'Traga seu pet, petiscos e muito carinho!', W / 2, 1265, { size: 28, weight: 700, color: 'rgba(73,56,47,.7)', align: 'center' });
        paw(ctx, W / 2 - 330, 1255, 34, c.main, -0.3);
        paw(ctx, W / 2 + 330, 1255, 34, c.main, 0.3);
      },
    },
    {
      id: 'aniv-topo',
      label: 'Topo de bolo',
      w: 1240,
      h: 1754,
      mm: [210, 297],
      draw(ctx, cc, a) {
        const W = 1240;
        const H = 1754;
        const p = cc.pet;
        const c = pal(p);
        const name = petName(p) === 'seu pet' ? 'Parabéns!' : petName(p);
        seed(name.length + 11);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        text(ctx, 'TOPO DE BOLO E TOPPERS · recorte na linha pontilhada e cole num palito', W / 2, 70, { size: 24, weight: 800, color: 'rgba(73,56,47,.55)', align: 'center', letterSpacing: 1 });

        // Topo principal
        const cx = W / 2;
        const cy = 560;
        ctx.save();
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = 'rgba(73,56,47,.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 470, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        scallop(ctx, cx, cy, 440, 34, c.main);
        ctx.beginPath();
        ctx.arc(cx, cy, 405, 0, Math.PI * 2);
        ctx.fillStyle = c.cream;
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 405, 0, Math.PI * 2);
        ctx.clip();
        confettiFancy(ctx, cx - 405, cy - 405, 810, 810, c.mix, 60, 1.2, { x: cx - 260, y: cy - 300, w: 520, h: 560 });
        ctx.restore();
        arcText(ctx, 'FELIZ ANIVERSÁRIO', cx, cy, 345, 46, c.dark, FONT_DISPLAY);
        balloon(ctx, cx - 300, cy - 30, 62, c.mix[1], -0.25, 1.4);
        balloon(ctx, cx + 300, cy - 40, 62, c.mix[2], 0.25, 1.4);
        partyPhoto(ctx, a.photo, p, cx, cy - 20, 200, c);
        ribbon(ctx, cx, cy + 250, 560, 110, c.main, name);
        const n = nextAge(p);
        if (n !== null) {
          starBurst(ctx, cx + 300, cy + 170, 80, c.gold, 14);
          text(ctx, String(n), cx + 300, cy + 196, { size: 78, weight: 700, family: 'display', color: '#fff', align: 'center' });
        }

        // Toppers pequenos
        const tops: ((x: number, y: number, r: number, i: number) => void)[] = [
          (x, y, r, i) => partyPhoto(ctx, pic(a, i), p, x, y, r * 0.78, c, true),
          (x, y, r) => {
            scallop(ctx, x, y, r, 20, c.gold);
            text(ctx, n !== null ? String(n) : '♥', x, y + r * 0.32, { size: r * 1.0, weight: 700, family: 'display', color: '#fff', align: 'center' });
          },
          (x, y, r) => {
            scallop(ctx, x, y, r, 20, c.mix[2]);
            cake(ctx, x, y + r * 0.55, r * 1.05, c, 3);
          },
          (x, y, r, i) => partyPhoto(ctx, pic(a, i), p, x, y, r * 0.78, c, false),
          (x, y, r) => {
            scallop(ctx, x, y, r, 20, c.main);
            text(ctx, 'Parabéns!', x, y + r * 0.12, { size: r * 0.34, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: r * 1.6 });
            sparkle(ctx, x - r * 0.55, y - r * 0.45, r * 0.16, '#fff');
            sparkle(ctx, x + r * 0.55, y + r * 0.45, r * 0.12, '#fff');
          },
          (x, y, r) => {
            scallop(ctx, x, y, r, 20, c.mix[4]);
            gift(ctx, x, y + r * 0.45, r * 0.9, c.main, c.gold);
          },
        ];
        const r = 140;
        tops.forEach((fn, i) => {
          const x = 230 + (i % 3) * 390;
          const y = 1210 + Math.floor(i / 3) * 330;
          ctx.save();
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = 'rgba(73,56,47,.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r + 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          fn(x, y, r, i);
        });
      },
    },
    {
      id: 'aniv-plaquinhas',
      label: 'Plaquinhas',
      w: 1240,
      h: 1754,
      mm: [210, 297],
      draw(ctx, cc) {
        const W = 1240;
        const p = cc.pet;
        const c = pal(p);
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        seed(name.length + 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, 1754);
        text(ctx, 'PLAQUINHAS PARA FOTOS · recorte e cole num palito', W / 2, 70, { size: 24, weight: 800, color: 'rgba(73,56,47,.55)', align: 'center', letterSpacing: 1 });

        const sticker = (draw: () => void) => {
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,.18)';
          ctx.shadowBlur = 16;
          ctx.shadowOffsetY = 6;
          draw();
          ctx.restore();
        };

        // 1. Balão de fala
        sticker(() => {
          rr(ctx, 90, 140, 500, 300, 60);
          ctx.moveTo(220, 440);
          ctx.lineTo(180, 520);
          ctx.lineTo(300, 440);
          ctx.fillStyle = c.main;
          ctx.fill();
        });
        confettiFancy(ctx, 110, 160, 460, 260, ['rgba(255,255,255,.35)'], 14, 1);
        wrap(ctx, name ? `Parabéns, ${name}!` : 'Parabéns pra mim!', 340, 275, 440, 76, { size: 66, weight: 700, family: 'display', color: '#fff', align: 'center', maxLines: 2 });

        // 2. Estrela "Hoje tem bolo!"
        sticker(() => starBurst(ctx, 900, 300, 210, c.gold, 12, 0.78));
        cake(ctx, 900, 300, 110, c, 3);
        text(ctx, 'Hoje tem bolo!', 900, 400, { size: 44, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: 300 });

        // 3. Faixa "Melhor pet do mundo"
        sticker(() => ribbon(ctx, W / 2, 680, 860, 150, c.mix[2], 'Melhor pet do mundo'));

        // 4. Coração
        sticker(() => heart(ctx, 330, 1010, 380, c.mix[3]));
        text(ctx, g(p, 'O mais lindo', 'A mais linda'), 330, 990, { size: 48, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: 300 });
        text(ctx, 'da festa', 330, 1050, { size: 48, weight: 700, family: 'display', color: '#fff', align: 'center' });

        // 5. Balão gigante "Festa do ..."
        balloon(ctx, 900, 1000, 200, c.mix[4], 0.08, 0.8);
        text(ctx, 'Festa', 900, 970, { size: 58, weight: 700, family: 'display', color: '#fff', align: 'center' });
        text(ctx, name ? doPet(p) : 'do pet', 900, 1040, { size: 50, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: 300 });

        // 6. Placa "Cadê meu presente?" com presente
        sticker(() => {
          rr(ctx, 140, 1300, 960, 300, 150);
          ctx.fillStyle = c.dark;
          ctx.fill();
        });
        gift(ctx, 300, 1520, 180, c.gold, '#fff');
        gift(ctx, 960, 1520, 150, c.mix[2], '#fff');
        text(ctx, 'Cadê meu presente?', W / 2 + 10, 1475, { size: 74, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: 560 });
        sparkle(ctx, 470, 1360, 22, c.gold);
        sparkle(ctx, 780, 1560, 18, c.gold);
      },
    },
    {
      id: 'aniv-certificado',
      label: 'Certificado',
      w: 1754,
      h: 1240,
      mm: [297, 210],
      draw(ctx, cc, a) {
        const W = 1754;
        const H = 1240;
        const p = cc.pet;
        const c = pal(p);
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        seed(name.length + 21);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFFCF5';
          ctx.fillRect(0, 0, W, H);
          // moldura dupla com cantos
          ctx.lineWidth = 22;
          ctx.strokeStyle = c.main;
          rr(ctx, 46, 46, W - 92, H - 92, 30);
          ctx.stroke();
          ctx.lineWidth = 3;
          ctx.strokeStyle = c.gold;
          rr(ctx, 84, 84, W - 168, H - 168, 20);
          ctx.stroke();
          for (const [x, y] of [
            [84, 84],
            [W - 84, 84],
            [84, H - 84],
            [W - 84, H - 84],
          ])
            starBurst(ctx, x, y, 34, c.gold, 8, 0.5);
          confettiFancy(ctx, 110, 110, W - 220, 150, c.mix, 26, 1.1);
        }
        text(ctx, 'CERTIFICADO', W / 2, 290, { size: 104, weight: 700, family: 'display', color: c.dark, align: 'center', letterSpacing: 10 });
        text(ctx, 'DE MELHOR PET DO MUNDO', W / 2, 360, { size: 40, weight: 900, color: c.main, align: 'center', letterSpacing: 8 });

        // foto com louros
        laurel(ctx, 400, 720, 245, '#7FA36B');
        partyPhoto(ctx, pic(a, 1), p, 400, 720, 175, c, false);

        text(ctx, 'Conferido com todo o amor a', 680, 560, { size: 38, weight: 700, color: 'rgba(73,56,47,.7)' });
        text(ctx, name || '____________', 680, 680, { size: 116, weight: 700, family: 'display', color: '#3a2a22', maxWidth: 820 });
        wrap(
          ctx,
          `por ser ${g(p, 'o companheiro', 'a companheira')} mais ${g(p, 'fiel, divertido e amado', 'fiel, divertida e amada')} que uma família poderia ter. Que venham muitos aniversários${ageLine(p) ? ` (agora são ${ageLine(p)}!)` : ''}.`,
          680,
          760,
          680,
          54,
          { size: 36, weight: 600, color: '#49382F', maxLines: 3 },
        );

        const tut = tutorNames(p);
        line(ctx, 680, 1010, 1060, 1010, 'rgba(73,56,47,.45)', 2);
        text(ctx, tut || 'Tutores', 870, 1050, { size: 26, weight: 700, color: '#8a7566', align: 'center', maxWidth: 380 });
        line(ctx, 1110, 1010, 1330, 1010, 'rgba(73,56,47,.45)', 2);
        text(ctx, 'Data', 1220, 1050, { size: 26, weight: 700, color: '#8a7566', align: 'center' });
        rosette(ctx, 1530, 860, 110, c.main, c.gold);
        paw(ctx, 1530, 860, 80, '#fff');
        sparkle(ctx, 1380, 790, 20, c.gold);
        sparkle(ctx, 1620, 1010, 16, c.gold);
      },
    },
  ],
};
