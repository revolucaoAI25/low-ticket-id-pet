'use client';

import { petName } from '@/lib/pet';
import { formatPhone } from '../common';
import { heart, paw, rr, text } from '../draw';
import type { DocDef } from '../types';

const S = 600;
const ROXO = '#6F2A7A';
const MEL = '#F5A524';

export const tagDoc: DocDef = {
  id: 'tag',
  title: 'Tag com QR Code',
  file: 'Tag-QR-do-{nome}',
  pages: [
    {
      id: 'tag-redonda',
      label: 'Tag redonda',
      w: S,
      h: S,
      mm: [32, 32],
      // Folha de impressão: 4 tags de 32 mm (coleira média) + 2 de 25 mm (gatos e pets pequenos) + 2 de 40 mm.
      printCopies: [
        [32, 32],
        [32, 32],
        [32, 32],
        [32, 32],
        [25, 25],
        [25, 25],
        [40, 40],
        [40, 40],
      ],
      round: true,
      needsQr: true,
      draw(ctx, c, a) {
        const cx = S / 2;
        if (a.background) ctx.drawImage(a.background, 0, 0, S, S);
        else {
          ctx.beginPath();
          ctx.arc(cx, cx, S / 2, 0, Math.PI * 2);
          ctx.fillStyle = ROXO;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cx, S / 2 - 26, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          // furo
          ctx.beginPath();
          ctx.arc(cx, 34, 16, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = ROXO;
          ctx.stroke();
        }
        text(ctx, 'ME ESCANEIE!', cx, 112, { size: 34, weight: 700, family: 'display', color: ROXO, align: 'center', letterSpacing: 2 });
        if (a.qr) {
          ctx.save();
          if (c.preview) ctx.globalAlpha = 0.35;
          ctx.drawImage(a.qr, cx - 140, 140, 280, 280);
          ctx.restore();
        }
        // faixa do nome
        rr(ctx, 120, 440, 360, 76, 38);
        ctx.fillStyle = MEL;
        ctx.fill();
        const name = petName(c.pet) === 'seu pet' ? 'Meu nome' : petName(c.pet);
        text(ctx, name, cx, 492, { size: 42, weight: 700, family: 'display', color: '#3a2410', align: 'center', maxWidth: 320 });
        heart(ctx, 160, 478, 22, '#fff');
        paw(ctx, 442, 478, 26, '#fff');
      },
    },
    {
      id: 'tag-verso',
      label: 'Verso da tag',
      w: S,
      h: S,
      mm: [32, 32],
      printCopies: [
        [32, 32],
        [32, 32],
        [32, 32],
        [32, 32],
        [25, 25],
        [25, 25],
        [40, 40],
        [40, 40],
      ],
      round: true,
      draw(ctx, c, a) {
        const cx = S / 2;
        if (a.background) ctx.drawImage(a.background, 0, 0, S, S);
        else {
          ctx.beginPath();
          ctx.arc(cx, cx, S / 2, 0, Math.PI * 2);
          ctx.fillStyle = MEL;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, 34, 16, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
        paw(ctx, cx, 170, 90, ROXO);
        text(ctx, 'Se me encontrar,', cx, 290, { size: 40, weight: 700, family: 'display', color: '#3a2410', align: 'center' });
        text(ctx, 'ligue pro meu tutor', cx, 340, { size: 40, weight: 700, family: 'display', color: '#3a2410', align: 'center' });
        const phone = formatPhone(c.phone);
        text(ctx, phone || '(__) _____-____', cx, 430, { size: 46, weight: 900, color: ROXO, align: 'center', maxWidth: 460 });
        text(ctx, 'Clube do Focinho', cx, 510, { size: 26, weight: 600, family: 'display', color: 'rgba(58,36,16,.7)', align: 'center' });
      },
    },
  ],
};
