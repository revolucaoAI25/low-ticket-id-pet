'use client';

import { formatDateBR, g, personalityLabel, petName, sexLabel } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { DISCLAIMER, photoCircle } from '../common';
import { dashedRect, field, heart, line, paw, rr, star, text, wrap } from '../draw';
import type { DocDef } from '../types';

const W = 1240;
const H = 1754;
const ROXO = '#6F2A7A';
const MEL = '#F5A524';
const CORAL = '#E9A092';

export const certidaoDoc: DocDef = {
  id: 'certidao',
  title: 'Certidão',
  file: 'Certidao-do-{nome}',
  pages: [
    {
      id: 'certidao',
      label: 'Certidão',
      w: W,
      h: H,
      mm: [210, 297],
      draw(ctx, c, a) {
        const p = c.pet;
        const adocao = p.origin === 'adocao';
        const name = petName(p) === 'seu pet' ? '' : petName(p);

        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFFBF4';
          ctx.fillRect(0, 0, W, H);
          // Molduras
          ctx.lineWidth = 14;
          ctx.strokeStyle = ROXO;
          rr(ctx, 50, 50, W - 100, H - 100, 40);
          ctx.stroke();
          ctx.lineWidth = 3;
          ctx.strokeStyle = CORAL;
          rr(ctx, 82, 82, W - 164, H - 164, 26);
          ctx.stroke();
          ctx.save();
          ctx.setLineDash([4, 14]);
          ctx.lineCap = 'round';
          ctx.lineWidth = 6;
          ctx.strokeStyle = 'rgba(245,165,36,.7)';
          rr(ctx, 104, 104, W - 208, H - 208, 18);
          ctx.stroke();
          ctx.restore();
          // Cantos
          for (const [x, y, r] of [
            [150, 150, -0.5],
            [W - 150, 150, 0.5],
            [150, H - 150, -2.6],
            [W - 150, H - 150, 2.6],
          ] as const) paw(ctx, x, y, 70, 'rgba(111,42,122,.18)', r);
        }

        text(ctx, adocao ? 'CERTIDÃO DE ADOÇÃO' : 'CERTIDÃO DE NASCIMENTO', W / 2, 250, { size: 76, weight: 700, family: 'display', color: ROXO, align: 'center', maxWidth: W - 300, letterSpacing: 2 });
        // fita
        line(ctx, 300, 300, 560, 300, MEL, 4);
        line(ctx, 680, 300, 940, 300, MEL, 4);
        heart(ctx, W / 2, 302, 44, MEL);
        text(ctx, 'Clube do Focinho · Kit Identidade Pet', W / 2, 362, { size: 30, weight: 700, color: '#8a7566', align: 'center' });

        // Foto
        photoCircle(ctx, a.photo, p, W / 2, 610, 200, { ring: 16, ringColor: MEL });
        ctx.beginPath();
        ctx.arc(W / 2, 610, 228, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(111,42,122,.25)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Nome
        if (name) text(ctx, name, W / 2, 940, { size: 104, weight: 700, family: 'display', color: '#3a2a22', align: 'center', maxWidth: W - 300 });
        else line(ctx, 330, 940, W - 330, 940, 'rgba(73,56,47,.3)', 3);

        // Texto
        const blank = '__________';
        const date = formatDateBR(p.date) || blank;
        const city = p.city?.trim() || blank;
        const tutors = p.tutors?.trim() || blank;
        const who = name || 'este pet';
        const body = adocao
          ? `Certificamos, com muito amor, que em ${date} ${who} foi ${g(p, 'adotado', 'adotada')} por ${tutors}, na cidade de ${city}, e ganhou para sempre uma família.`
          : `Certificamos, com muito amor, que ${who} nasceu em ${date}, na cidade de ${city}, e desde então enche de alegria a vida de ${tutors}.`;
        wrap(ctx, body, W / 2, 1030, W - 360, 50, { size: 36, weight: 600, color: '#49382F', align: 'center', maxLines: 4 });

        // Dados
        const x1 = 200;
        const colW = (W - 400 - 60) / 2;
        const x2 = x1 + colW + 60;
        const opt = { labelColor: ROXO, size: 34, labelSize: 20 };
        field(ctx, 'Espécie', getSpecies(p.species)?.label ?? '', x1, 1250, colW, opt);
        field(ctx, 'Raça', p.breed ?? '', x2, 1250, colW, opt);
        field(ctx, 'Sexo', sexLabel(p), x1, 1350, colW, opt);
        field(ctx, 'Personalidade', personalityLabel(p) ?? '', x2, 1350, colW, opt);

        // Assinaturas
        line(ctx, 200, 1530, 560, 1530, 'rgba(73,56,47,.4)', 2);
        text(ctx, 'Tutores', 380, 1566, { size: 24, weight: 700, color: '#8a7566', align: 'center' });
        dashedRect(ctx, 700, 1430, 180, 130, 18, ROXO, 3);
        text(ctx, 'Patinha', 790, 1592, { size: 24, weight: 700, color: '#8a7566', align: 'center' });

        // Selo
        const sx = 1010;
        const sy = 1490;
        ctx.beginPath();
        for (let i = 0; i < 36; i++) {
          const r = i % 2 ? 92 : 104;
          const ang = (i * Math.PI) / 18;
          ctx.lineTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r);
        }
        ctx.closePath();
        ctx.fillStyle = MEL;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 78, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        paw(ctx, sx, sy - 12, 58, '#fff');
        star(ctx, sx - 40, sy + 42, 9, '#fff');
        star(ctx, sx, sy + 50, 9, '#fff');
        star(ctx, sx + 40, sy + 42, 9, '#fff');

        text(ctx, DISCLAIMER, W / 2, H - 132, { size: 20, weight: 700, color: 'rgba(73,56,47,.5)', align: 'center' });
      },
    },
  ],
};
