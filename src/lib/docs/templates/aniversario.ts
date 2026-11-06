'use client';

/**
 * Kit Aniversário (bônus). Montado em código: usa a cor favorita e as fotos extras do formulário de confirmação.
 */

import { ageYears, doPet, g, petName, tutorNames, type PetData } from '@/lib/pet';
import { photoCircle } from '../common';
import { FONT_DISPLAY, heart, line, paw, rr, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import {
  arcText,
  balloon,
  balloonCluster,
  bunting,
  cake,
  confettiFancy,
  foilNumber,
  frostingEdge,
  gift,
  laurel,
  outlinedText,
  palette,
  partyHat,
  polkaDots,
  ribbon,
  rosette,
  scallop,
  seed,
  shade,
  sparkle,
  starBurst,
  sticker,
} from '../party';
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
          bg.addColorStop(1, shade(c.light, 0.5));
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
          polkaDots(ctx, 0, 0, W, H, 'rgba(255,255,255,.55)', 46, 5);
          frostingEdge(ctx, 0, H - 120, W, 120, c.main, 10);
          polkaDots(ctx, 0, H - 80, W, 80, 'rgba(255,255,255,.35)', 34, 4);
          confettiFancy(ctx, 0, 90, W, H - 200, c.mix, 70, 1.3, { x: 100, y: 300, w: W - 200, h: H - 420 });
          bunting(ctx, -30, 30, W + 30, 60, c.mix, 72);
          balloonCluster(ctx, 110, 250, 175, c.mix);
          balloonCluster(ctx, W - 110, 265, 165, [...c.mix].reverse(), true);
        }
        // cartão central com borda ondulada no topo
        ctx.save();
        ctx.shadowColor = 'rgba(80,40,30,.16)';
        ctx.shadowBlur = 34;
        ctx.shadowOffsetY = 12;
        rr(ctx, 100, 330, W - 200, H - 470, 46);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
        ctx.save();
        rr(ctx, 100, 330, W - 200, H - 470, 46);
        ctx.clip();
        ctx.fillStyle = c.light;
        ctx.fillRect(100, 330, W - 200, 120);
        polkaDots(ctx, 100, 330, W - 200, 120, 'rgba(255,255,255,.7)', 30, 4);
        frostingEdge(ctx, 100, 450, W - 200, 40, '#fff', 12);
        ctx.restore();

        outlinedText(ctx, 'VEM PRA MINHA FESTA!', W / 2, 412, { size: 46, family: FONT_DISPLAY, fill: c.dark, stroke: '#fff', strokeW: 12, maxWidth: W - 280 });
        partyPhoto(ctx, a.photo, p, W / 2 - 40, 650, 160, c);
        const n = nextAge(p);
        if (n !== null) {
          foilNumber(ctx, String(n), W / 2 + 255, 760, 260, FONT_DISPLAY);
          outlinedText(ctx, p.origin === 'adocao' ? `${n === 1 ? 'ano' : 'anos'} de família` : n === 1 ? 'aninho' : 'aninhos', W / 2 + 255, 810, {
            size: 30,
            family: FONT_DISPLAY,
            fill: c.dark,
            stroke: '#fff',
            strokeW: 8,
            maxWidth: 230,
          });
        }
        ribbon(ctx, W / 2, 900, 640, 108, c.main, name ? `Aniversário ${doPet(p)}` : 'Aniversário do meu pet');
        sparkle(ctx, 190, 560, 22, c.gold);
        sparkle(ctx, 240, 760, 14, c.mix[2]);
        sparkle(ctx, 820, 520, 16, c.mix[3]);

        const rows: [string, string][] = [
          ['DIA', '____ / ____'],
          ['HORA', '______ h'],
          ['LOCAL', ''],
        ];
        rows.forEach(([k, v], i) => {
          const y = 1035 + i * 70;
          rr(ctx, 200, y - 38, 124, 50, 25);
          ctx.fillStyle = c.main;
          ctx.fill();
          text(ctx, k, 262, y - 4, { size: 21, weight: 900, color: '#fff', align: 'center', letterSpacing: 1 });
          line(ctx, 344, y + 4, W - 200, y + 4, shade(c.main, 0.3), 3, [2, 9]);
          if (v) text(ctx, v, 356, y - 6, { size: 26, weight: 700, color: 'rgba(73,56,47,.35)' });
        });
        text(ctx, 'Traga seu pet, petiscos e muito carinho!', W / 2, 1238, { size: 26, weight: 700, color: 'rgba(73,56,47,.7)', align: 'center' });
        paw(ctx, W / 2 - 320, 1230, 30, c.main, -0.3);
        paw(ctx, W / 2 + 320, 1230, 30, c.main, 0.3);
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
        text(ctx, 'TOPO DE BOLO E TOPPERS · recorte em volta da borda branca e cole num palito', W / 2, 66, { size: 23, weight: 800, color: 'rgba(73,56,47,.55)', align: 'center', letterSpacing: 1 });

        // Topo principal (adesivo com borda branca para recortar)
        const cx = W / 2;
        const cy = 570;
        const n = nextAge(p);
        sticker(
          ctx,
          { x: cx - 520, y: cy - 470, w: 1040, h: 960 },
          (k) => {
            scallop(k, cx, cy, 430, 34, c.main);
            k.beginPath();
            k.arc(cx, cy, 395, 0, Math.PI * 2);
            k.fillStyle = c.cream;
            k.fill();
            k.save();
            k.beginPath();
            k.arc(cx, cy, 395, 0, Math.PI * 2);
            k.clip();
            polkaDots(k, cx - 400, cy - 400, 800, 800, shade(c.main, 0.75), 40, 6);
            confettiFancy(k, cx - 395, cy - 395, 790, 790, c.mix, 50, 1.2, { x: cx - 250, y: cy - 290, w: 500, h: 560 });
            k.restore();
            arcText(k, 'FELIZ ANIVERSÁRIO', cx, cy, 335, 48, c.dark, FONT_DISPLAY);
            balloon(k, cx - 300, cy - 20, 64, c.mix[1], -0.25, 1.3);
            balloon(k, cx + 305, cy - 40, 60, c.mix[2], 0.25, 1.3);
            partyPhoto(k, a.photo, p, cx, cy - 10, 195, c);
            ribbon(k, cx, cy + 255, 580, 112, c.main, name);
            if (n !== null) foilNumber(k, String(n), cx + 300, cy + 210, 190, FONT_DISPLAY);
          },
          18,
        );

        // Toppers pequenos (cada um vira um adesivo)
        const tops: ((k: Ctx, x: number, y: number, r: number, i: number) => void)[] = [
          (k, x, y, r, i) => partyPhoto(k, pic(a, i), p, x, y, r * 0.8, c, true),
          (k, x, y, r) => {
            scallop(k, x, y, r, 20, c.light);
            if (n !== null) foilNumber(k, String(n), x, y + r * 0.42, r * 1.25, FONT_DISPLAY);
            else heart(k, x, y, r, c.main);
          },
          (k, x, y, r) => {
            scallop(k, x, y, r, 20, c.mix[2]);
            cake(k, x, y + r * 0.55, r * 1.05, c, 3);
          },
          (k, x, y, r, i) => partyPhoto(k, pic(a, i + 1), p, x, y, r * 0.8, c, false),
          (k, x, y, r) => {
            scallop(k, x, y, r, 20, c.main);
            k.save();
            k.beginPath();
            k.arc(x, y, r * 0.95, 0, Math.PI * 2);
            k.clip();
            polkaDots(k, x - r, y - r, r * 2, r * 2, 'rgba(255,255,255,.25)', 26, 4);
            k.restore();
            outlinedText(k, 'Parabéns!', x, y + r * 0.13, { size: r * 0.36, family: FONT_DISPLAY, fill: '#fff', stroke: c.dark, strokeW: 8, maxWidth: r * 1.6 });
            sparkle(k, x - r * 0.55, y - r * 0.45, r * 0.16, '#fff');
            sparkle(k, x + r * 0.55, y + r * 0.45, r * 0.12, '#fff');
          },
          (k, x, y, r) => {
            scallop(k, x, y, r, 20, c.mix[4]);
            gift(k, x, y + r * 0.45, r * 0.9, c.main, c.gold);
          },
        ];
        const r = 135;
        tops.forEach((fn, i) => {
          const x = 230 + (i % 3) * 390;
          const y = 1230 + Math.floor(i / 3) * 320;
          sticker(ctx, { x: x - r - 20, y: y - r - 20, w: (r + 20) * 2, h: (r + 20) * 2 }, (k) => fn(k, x, y, r, i), 14);
        });
      },
    },
    {
      id: 'aniv-plaquinhas',
      label: 'Plaquinhas',
      w: 1240,
      h: 1754,
      mm: [210, 297],
      draw(ctx, cc, a) {
        const W = 1240;
        const p = cc.pet;
        const c = pal(p);
        const name = petName(p) === 'seu pet' ? '' : petName(p);
        seed(name.length + 5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, 1754);
        if (a.background) ctx.drawImage(a.background, 0, 0, W, 1754);
        text(ctx, 'PLAQUINHAS PARA FOTOS · recorte em volta da borda branca e cole num palito', W / 2, 66, { size: 23, weight: 800, color: 'rgba(73,56,47,.55)', align: 'center', letterSpacing: 1 });
        const say = (k: Ctx, t: string, x: number, y: number, size: number, max: number, stroke = c.dark) =>
          outlinedText(k, t, x, y, { size, family: FONT_DISPLAY, fill: '#fff', stroke, strokeW: size * 0.22, maxWidth: max });

        // 1. Balão de fala com poá
        sticker(ctx, { x: 80, y: 130, w: 520, h: 400 }, (k) => {
          rr(k, 90, 140, 500, 300, 64);
          k.moveTo(220, 436);
          k.lineTo(170, 520);
          k.lineTo(310, 436);
          k.fillStyle = c.main;
          k.fill();
          k.save();
          k.clip();
          polkaDots(k, 90, 140, 500, 380, 'rgba(255,255,255,.18)', 34, 6);
          k.restore();
          say(k, name ? 'Parabéns,' : 'Parabéns', 340, 270, 72, 440);
          say(k, name ? `${name}!` : 'pra mim!', 340, 355, 72, 440);
        });

        // 2. Estrela com bolo
        sticker(ctx, { x: 680, y: 80, w: 440, h: 440 }, (k) => {
          starBurst(k, 900, 300, 210, c.gold, 12, 0.78);
          starBurst(k, 900, 300, 175, shade(c.gold, 0.25), 12, 0.78);
          cake(k, 900, 300, 120, c, 3);
          say(k, 'Hoje tem bolo!', 900, 395, 46, 300, shade(c.gold, -0.45));
        });

        // 3. Faixa
        sticker(ctx, { x: 30, y: 580, w: 1180, h: 210 }, (k) => ribbon(k, W / 2, 680, 840, 150, c.mix[2], 'Melhor pet do mundo', { size: 76 }));

        // 4. Coração com foto
        sticker(ctx, { x: 40, y: 730, w: 600, h: 470 }, (k) => {
          heart(k, 335, 1000, 480, c.mix[3]);
          partyPhoto(k, pic(a, 0), p, 335, 925, 78, c, false);
          say(k, g(p, 'O mais lindo', 'A mais linda'), 335, 1072, 48, 380);
          say(k, 'da festa', 335, 1124, 48, 380);
        });

        // 5. Balão gigante
        sticker(ctx, { x: 680, y: 790, w: 440, h: 580 }, (k) => {
          balloon(k, 900, 1000, 200, c.mix[4], 0.08, 0.8);
          say(k, 'Festa', 900, 975, 66, 300, shade(c.mix[4], -0.45));
          say(k, name ? doPet(p) : 'do pet', 900, 1050, 54, 300, shade(c.mix[4], -0.45));
        });

        // 6. Placa com presentes
        sticker(ctx, { x: 130, y: 1300, w: 980, h: 330 }, (k) => {
          rr(k, 140, 1310, 960, 300, 150);
          k.fillStyle = c.dark;
          k.fill();
          k.save();
          k.clip();
          polkaDots(k, 140, 1310, 960, 300, 'rgba(255,255,255,.08)', 36, 6);
          k.restore();
          gift(k, 250, 1545, 160, c.gold, '#fff');
          gift(k, 995, 1545, 140, c.mix[2], '#fff');
          say(k, 'Cadê meu presente?', W / 2, 1485, 72, 520, shade(c.dark, -0.4));
          sparkle(k, 470, 1370, 22, c.gold);
          sparkle(k, 790, 1575, 18, c.gold);
        });
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
          { size: 36, weight: 600, color: '#49382F', maxLines: 4 },
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
