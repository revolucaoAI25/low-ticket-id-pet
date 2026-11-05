'use client';

import { doPet, petName } from '@/lib/pet';
import { photoCircle } from '../common';
import { drawContain, heart, line, paw, rr, text, wrap } from '../draw';
import type { Ctx } from '../draw';
import type { DocDef } from '../types';

const W = 1240;
const H = 1754;
const ROXO = '#6F2A7A';
const CREME = '#FFF8EF';

/**
 * Instruções de montagem (primeira parte do PDF único).
 * Textos provisórios: refinar quando os modelos finais chegarem.
 */
export const INSTRUCTIONS: { title: string; body: string }[] = [
  { title: 'Antes de imprimir', body: 'Imprima em folha A4, na opção "tamanho real" (100%, sem ajustar à página). Os documentos já estão no tamanho certo e com linha pontilhada para recortar.' },
  { title: 'Papel ideal', body: 'Para RG, CNH e carteirinha de torcedor, use papel fotográfico ou couchê 180 g (ou mais). Certidão, carteira de vacinação e bônus podem ir em papel comum ou offset 120 g.' },
  { title: 'RG, CNH e Torcedor', body: 'Recorte frente e verso, cole um no outro (cola bastão ou fita dupla face) e plastifique. Na papelaria, peça plastificação no tamanho de documento.' },
  { title: 'Tag Ossinho com QR Code', body: 'Recorte os dois lados do ossinho, cole um no outro e plastifique. Fure no círculo e prenda na coleira com uma argola ou porta-tag. Teste o QR Code com a câmera antes de usar.' },
  { title: 'Passaporte de Aventuras', body: 'Recorte as páginas, dobre ao meio e grampeie como um livrinho. Use para colar fotos e "carimbar" passeios e primeiras vezes.' },
  { title: 'Carteira de Vacinação (dobrável)', body: 'Imprima as duas páginas dela em frente e verso, virando pela borda longa (ou cole uma atrás da outra). Dobre o painel da direita para dentro e depois o da esquerda por cima: a capa fica na frente.' },
  { title: 'Certidão', body: 'Fica linda numa moldura A4. Use papel mais grosso (180 g) para durar mais.' },
  { title: 'Bônus', body: 'O Kit Aniversário traz convite, topo de bolo, plaquinhas e certificado: recorte e cole em palitos. O Kit Quem Cuida é para deixar com quem fica com seu pet.' },
];

function bg(ctx: Ctx) {
  ctx.fillStyle = CREME;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r] of [
    [140, 160, -0.4],
    [W - 150, 300, 0.4],
    [180, H - 260, 0.2],
    [W - 170, H - 180, -0.3],
  ] as const)
    paw(ctx, x, y, 110, 'rgba(111,42,122,.07)', r);
}

export const guiaDoc: DocDef = {
  id: 'guia',
  title: 'Capa e instruções',
  file: 'Instrucoes-{nome}',
  pages: [
    {
      id: 'guia-capa',
      label: 'Capa',
      w: W,
      h: H,
      mm: [210, 297],
      draw(ctx, c, a) {
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else bg(ctx);
        if (a.logo) drawContain(ctx, a.logo, W / 2 - 230, 150, 460, 420);
        text(ctx, 'KIT IDENTIDADE PET', W / 2, 680, { size: 44, weight: 900, color: ROXO, align: 'center', letterSpacing: 8 });
        photoCircle(ctx, a.photo, c.pet, W / 2, 1000, 230, { ring: 18, ringColor: '#F5A524' });
        const name = petName(c.pet) === 'seu pet' ? '' : petName(c.pet);
        text(ctx, name ? `O kit ${doPet(c.pet)}` : 'O kit do seu pet', W / 2, 1360, { size: 96, weight: 700, family: 'display', color: '#3a2a22', align: 'center', maxWidth: W - 200 });
        heart(ctx, W / 2, 1440, 50, '#F5A524');
        text(ctx, 'Feito com carinho pelo Clube do Focinho', W / 2, 1530, { size: 32, weight: 700, color: 'rgba(73,56,47,.65)', align: 'center' });
      },
    },
    {
      id: 'guia-instrucoes',
      label: 'Como montar',
      w: W,
      h: H,
      mm: [210, 297],
      draw(ctx, _c, a) {
        if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
        else bg(ctx);
        text(ctx, 'Como montar o seu kit', W / 2, 190, { size: 78, weight: 700, family: 'display', color: ROXO, align: 'center' });
        text(ctx, 'Leva uns 20 minutinhos. Vale chamar a família!', W / 2, 260, { size: 32, weight: 700, color: 'rgba(73,56,47,.7)', align: 'center' });
        let y = 296;
        INSTRUCTIONS.forEach((it, i) => {
          rr(ctx, 100, y, W - 200, 156, 28);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(170, y + 78, 36, 0, Math.PI * 2);
          ctx.fillStyle = ROXO;
          ctx.fill();
          text(ctx, String(i + 1), 170, y + 92, { size: 40, weight: 900, color: '#fff', align: 'center' });
          text(ctx, it.title, 240, y + 50, { size: 34, weight: 700, family: 'display', color: '#3a2a22', maxWidth: W - 380 });
          wrap(ctx, it.body, 240, y + 88, W - 380, 28, { size: 21, weight: 600, color: 'rgba(73,56,47,.85)', maxLines: 3 });
          y += 166;
        });
        line(ctx, 100, H - 120, W - 100, H - 120, 'rgba(73,56,47,.15)', 2);
        text(ctx, 'Produto personalizado de uso pessoal. Não tem validade oficial e não substitui documentos de médico-veterinário ou órgãos públicos.', W / 2, H - 70, {
          size: 20,
          weight: 700,
          color: 'rgba(73,56,47,.55)',
          align: 'center',
          maxWidth: W - 200,
        });
      },
    },
  ],
};
