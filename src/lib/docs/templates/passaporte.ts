'use client';

import { cityOf, formatDateBR, personalityLabel, petName, tutorNames } from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { photoBox } from '../common';
import { dashedRect, field, paw, pawPattern, rr, star, text } from '../draw';
import type { DocDef } from '../types';

const W = 700;
const H = 1000;
const NAVY = '#4E1C57';
const GOLD = '#F2C46B';

const FIRSTS: { key: string; label: string; emoji: string }[] = [
  { key: 'praia', label: 'Primeira praia', emoji: '🏖️' },
  { key: 'parque', label: 'Primeiro parque', emoji: '🌳' },
  { key: 'carro', label: 'Primeira viagem', emoji: '🚗' },
  { key: 'banho', label: 'Primeiro banho', emoji: '🛁' },
  { key: 'aniversario', label: 'Primeiro aniversário', emoji: '🎂' },
  { key: 'amigo', label: 'Novo amigo', emoji: '🐾' },
  { key: 'trilha', label: 'Primeira trilha', emoji: '🥾' },
  { key: 'neve', label: 'Primeiro frio', emoji: '❄️' },
];

const INKS = ['#C2410C', '#1D4ED8', '#15803D', '#9D174D', '#7C3AED', '#B45309'];

function emoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, size: number) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.fillText(e, x, y);
  ctx.textBaseline = 'alphabetic';
}

export const passaporteDoc: DocDef = {
  id: 'passaporte',
  title: 'Passaporte de Aventuras',
  file: 'Passaporte-do-{nome}',
  pages: [
    {
      id: 'passaporte-capa',
      label: 'Capa',
      w: W,
      h: H,
      mm: [92, 131],
      draw(ctx, c, a) {
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, '#6F2A7A');
          grad.addColorStop(1, NAVY);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
          pawPattern(ctx, 0, 0, W, H, 'rgba(255,255,255,.05)', 110, 36);
          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 3;
          rr(ctx, 30, 30, W - 60, H - 60, 24);
          ctx.stroke();
        }
        text(ctx, 'PASSAPORTE', W / 2, 200, { size: 74, weight: 700, family: 'display', color: GOLD, align: 'center', letterSpacing: 4 });
        text(ctx, 'DE AVENTURAS', W / 2, 262, { size: 40, weight: 600, family: 'display', color: GOLD, align: 'center', letterSpacing: 8 });
        // Emblema
        ctx.beginPath();
        ctx.arc(W / 2, 500, 150, 0, Math.PI * 2);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W / 2, 500, 126, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.stroke();
        // "globo" com meridianos
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, 500, 126, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = 'rgba(242,196,107,.35)';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(W / 2, 500, Math.abs(i) * 40 + 1, 126, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(W / 2 - 130, 500 + i * 45);
          ctx.lineTo(W / 2 + 130, 500 + i * 45);
          ctx.stroke();
        }
        ctx.restore();
        paw(ctx, W / 2, 505, 130, GOLD);
        for (let i = 0; i < 5; i++) star(ctx, W / 2 - 100 + i * 50, 690, 12, GOLD);
        const name = petName(c.pet) === 'seu pet' ? '' : petName(c.pet);
        text(ctx, name.toUpperCase(), W / 2, 800, { size: 56, weight: 700, family: 'display', color: '#fff', align: 'center', maxWidth: W - 120, letterSpacing: 3 });
        text(ctx, 'CLUBE DO FOCINHO', W / 2, 900, { size: 26, weight: 700, family: 'display', color: GOLD, align: 'center', letterSpacing: 6 });
      },
    },
    {
      id: 'passaporte-dados',
      label: 'Identificação',
      w: W,
      h: H,
      mm: [92, 131],
      draw(ctx, c, a) {
        const p = c.pet;
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFF8EC';
          ctx.fillRect(0, 0, W, H);
          // guilhoché simples
          ctx.strokeStyle = 'rgba(111,42,122,.06)';
          ctx.lineWidth = 2;
          for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            ctx.arc(W / 2, H + 200, 200 + i * 28, Math.PI, 2 * Math.PI);
            ctx.stroke();
          }
          ctx.fillStyle = '#6F2A7A';
          ctx.fillRect(0, 0, W, 96);
          text(ctx, 'IDENTIFICAÇÃO DO VIAJANTE', W / 2, 62, { size: 30, weight: 700, family: 'display', color: GOLD, align: 'center', letterSpacing: 3 });
        }
        photoBox(ctx, a.photo, p, 50, 140, 240, 300, 18, { border: 6, borderColor: '#fff' });
        const x = 320;
        const w = W - x - 50;
        const opt = { labelColor: '#6F2A7A', size: 28, labelSize: 15 };
        field(ctx, 'Nome', petName(p) === 'seu pet' ? '' : petName(p), x, 160, w, opt);
        field(ctx, 'Espécie', getSpecies(p.species)?.label ?? '', x, 245, w, opt);
        field(ctx, 'Raça', p.breed ?? '', x, 330, w, opt);
        field(ctx, p.origin === 'adocao' ? 'Adoção' : 'Nascimento', formatDateBR(p.date), x, 415, w, opt);
        field(ctx, 'Cidade natal', cityOf(p), 50, 520, W - 100, opt);
        field(ctx, 'Tutores', tutorNames(p), 50, 605, W - 100, opt);
        field(ctx, 'Personalidade', personalityLabel(p) ?? '', 50, 690, W - 100, opt);
        // faixa "MRZ" divertida
        ctx.fillStyle = 'rgba(111,42,122,.08)';
        ctx.fillRect(0, 820, W, 120);
        const n = (petName(p) === 'seu pet' ? 'PET' : petName(p)).toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '');
        text(ctx, `P<CDF<${n}<<<<<<<<<<<<<<<<<<<<<<<<<<<`, 40, 868, { size: 28, weight: 700, color: 'rgba(73,56,47,.55)', maxWidth: W - 80, family: 'body', letterSpacing: 3 });
        text(ctx, `AVENTURAS<<<<<<SEM<LIMITES<<<<<<<<<<<<<<`, 40, 912, { size: 28, weight: 700, color: 'rgba(73,56,47,.55)', maxWidth: W - 80, family: 'body', letterSpacing: 3 });
      },
    },
    {
      id: 'passaporte-carimbos',
      label: 'Carimbos',
      w: W,
      h: H,
      mm: [92, 131],
      draw(ctx, c, a) {
        const p = c.pet;
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else {
          ctx.fillStyle = '#FFF8EC';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#6F2A7A';
          ctx.fillRect(0, 0, W, 96);
          text(ctx, 'CARIMBOS & PRIMEIRAS VEZES', W / 2, 62, { size: 30, weight: 700, family: 'display', color: GOLD, align: 'center', letterSpacing: 2, maxWidth: W - 60 });
        }
        const cells: { label: string; emoji: string; stamp?: string }[] = [];
        for (const f of FIRSTS) {
          if (cells.length >= 6) break;
          cells.push({ label: f.label, emoji: f.emoji });
        }
        const cols = 2;
        const cw = (W - 100) / cols;
        const ch = 280;
        cells.forEach((cell, i) => {
          const cx = 50 + (i % cols) * cw + cw / 2;
          const cy = 140 + Math.floor(i / cols) * ch + ch / 2 - 10;
          if (cell.stamp) {
            const ink = INKS[(p.name?.length ?? 0) % INKS.length];
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-0.16);
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.arc(0, 0, 112, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 96, 0, Math.PI * 2);
            ctx.stroke();
            text(ctx, 'PRIMEIRO CARIMBO', 0, -58, { size: 15, weight: 900, color: ink, align: 'center', letterSpacing: 1.5 });
            emoji(ctx, cell.emoji, 0, -8, 50);
            text(ctx, cell.stamp, 0, 48, { size: 24, weight: 700, family: 'display', color: ink, align: 'center', maxWidth: 170 });
            text(ctx, '★ LUGAR FAVORITO ★', 0, 76, { size: 13, weight: 900, color: ink, align: 'center' });
            ctx.restore();
          } else {
            dashedRect(ctx, cx - 115, cy - 115, 230, 230, 115, 'rgba(111,42,122,.35)', 3, [8, 10]);
            ctx.globalAlpha = 0.35;
            emoji(ctx, cell.emoji, cx, cy - 20, 44);
            ctx.globalAlpha = 1;
            text(ctx, cell.label, cx, cy + 40, { size: 20, weight: 800, color: 'rgba(73,56,47,.55)', align: 'center', maxWidth: 190 });
            text(ctx, '___/___/____', cx, cy + 72, { size: 18, weight: 700, color: 'rgba(73,56,47,.35)', align: 'center' });
          }
        });
      },
    },
  ],
};

export { FIRSTS };
