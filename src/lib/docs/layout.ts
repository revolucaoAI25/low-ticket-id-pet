'use client';

import {
  addressLine,
  ageLabel,
  cityOf,
  clubNumber,
  doPet,
  formatDateBR,
  personalityLabel,
  petName,
  sexLabel,
  tutorNames,
} from '@/lib/pet';
import { getSpecies } from '@/lib/species';
import { formatPhone } from '@/lib/format';
import { maskNumber, photoBox, photoCircle } from './common';
import { drawContain, text, wrap } from './draw';
import type { Ctx } from './draw';
import type { Assets, DocContext, DocPage, TextSlot } from './types';

const today = () => formatDateBR(new Date().toISOString().slice(0, 10));

/**
 * Campos disponíveis para mapear nos templates.
 * Para um texto fixo, use "=" na frente (ex.: field: "=ETERNA").
 */
export const FIELDS: Record<string, { label: string; get: (c: DocContext) => string }> = {
  nome: { label: 'Nome do pet', get: (c) => (petName(c.pet) === 'seu pet' ? '' : petName(c.pet)) },
  doNome: { label: '"do Paçoca" / "da Mel"', get: (c) => doPet(c.pet) },
  especie: { label: 'Espécie', get: (c) => getSpecies(c.pet.species)?.label ?? '' },
  raca: { label: 'Raça', get: (c) => c.pet.breed ?? '' },
  sexo: { label: 'Sexo', get: (c) => sexLabel(c.pet) },
  data: { label: 'Data de nascimento ou adoção', get: (c) => formatDateBR(c.pet.date) },
  nascimento: { label: 'Data de nascimento (vazio se adotado)', get: (c) => (c.pet.origin === 'adocao' ? '' : formatDateBR(c.pet.date)) },
  adocao: { label: 'Data de adoção (vazio se nasceu em casa)', get: (c) => (c.pet.origin === 'adocao' ? formatDateBR(c.pet.date) : '') },
  rotuloData: { label: '"Nascimento" ou "Adoção"', get: (c) => (c.pet.origin === 'adocao' ? 'Adoção' : 'Nascimento') },
  idade: { label: 'Idade / na família desde', get: (c) => ageLabel(c.pet) },
  ano: { label: 'Ano (nascimento/adoção)', get: (c) => c.pet.date?.slice(0, 4) ?? '' },
  personalidade: { label: 'Personalidade', get: (c) => personalityLabel(c.pet) ?? '' },
  tutores: { label: 'Tutores (separados por vírgula)', get: (c) => tutorNames(c.pet) },
  tutor1: { label: 'Primeiro tutor', get: (c) => c.pet.tutors?.[0]?.name ?? '' },
  telefone: { label: 'Telefone do tutor', get: (c) => formatPhone(c.pet.tutors?.find((t) => t.phone)?.phone || c.phone) },
  cidade: { label: 'Cidade', get: (c) => cityOf(c.pet) },
  endereco: { label: 'Endereço completo', get: (c) => addressLine(c.pet) },
  rua: { label: 'Rua e número', get: (c) => c.pet.address?.street ?? '' },
  bairro: { label: 'Bairro', get: (c) => c.pet.address?.district ?? '' },
  registro: { label: 'Nº do RG do Clube', get: (c) => maskNumber(clubNumber(c.seed), c.preview) },
  registroCnh: { label: 'Nº de registro da CNH', get: (c) => maskNumber(clubNumber(c.seed + 'cnh').replace(/\./g, ''), c.preview) },
  hoje: { label: 'Data de hoje (expedição)', get: () => today() },
  time: { label: 'Time', get: (c) => (c.pet.team?.none ? '' : c.team?.short ?? c.pet.team?.name ?? '') },
  microchip: { label: 'Microchip', get: (c) => c.pet.extras?.microchip ?? '' },
  rgAnimal: { label: 'Nº RG Animal (SinPatinhas)', get: (c) => c.pet.extras?.rgAnimal ?? '' },
  pelagem: { label: 'Pelagem / sinais', get: (c) => c.pet.extras?.coat ?? '' },
  porte: { label: 'Porte', get: (c) => c.pet.extras?.size ?? '' },
  peso: { label: 'Peso', get: (c) => c.pet.extras?.weight ?? '' },
  alergias: { label: 'Alergias', get: (c) => c.pet.extras?.allergies ?? '' },
  remedios: { label: 'Remédios', get: (c) => c.pet.extras?.medications ?? '' },
  cuidados: { label: 'Cuidados especiais', get: (c) => c.pet.extras?.conditions ?? '' },
  veterinario: { label: 'Veterinário / clínica', get: (c) => [c.pet.extras?.vetName, c.pet.extras?.vetClinic].filter(Boolean).join(' · ') },
  telVeterinario: { label: 'Telefone do veterinário', get: (c) => formatPhone(c.pet.extras?.vetPhone) },
  comida: { label: 'Alimentação', get: (c) => [c.pet.extras?.food, c.pet.extras?.feedingTimes].filter(Boolean).join(' · ') },
  passeios: { label: 'Passeios', get: (c) => c.pet.extras?.walks ?? '' },
  manias: { label: 'Manias', get: (c) => c.pet.extras?.habits ?? '' },
  naoPode: { label: 'O que não pode', get: (c) => c.pet.extras?.forbidden ?? '' },
  contato1: { label: 'Contato de emergência 1', get: (c) => contact(c, 0) },
  contato2: { label: 'Contato de emergência 2', get: (c) => contact(c, 1) },
};

function contact(c: DocContext, i: number): string {
  const ct = c.pet.extras?.contacts?.[i];
  if (!ct) return '';
  return [ct.name, formatPhone(ct.phone)].filter(Boolean).join(' · ');
}

export function fieldValue(field: string, c: DocContext): string {
  if (field.startsWith('=')) return field.slice(1);
  return FIELDS[field]?.get(c) ?? '';
}

/** Desenha o template e escreve os campos por cima. */
export function drawSlots(ctx: Ctx, page: DocPage, c: DocContext, a: Assets) {
  const W = page.w;
  const H = page.h;
  if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
  for (const s of page.slots ?? []) {
    if (s.type === 'text') {
      drawText(ctx, s, c, W, H);
      continue;
    }
    const x = s.x * W;
    const y = s.y * H;
    const w = s.w * W;
    const h = s.h * H;
    const r = (s.radius ?? 0) * w;
    if (s.type === 'photo' || s.type === 'extraPhoto') {
      const img = s.type === 'extraPhoto' ? a.photos[s.index ?? 0] ?? a.photo : a.photo;
      if ((s.radius ?? 0) >= 0.5 && Math.abs(w - h) < 2) photoCircle(ctx, img, c.pet, x + w / 2, y + h / 2, w / 2);
      else photoBox(ctx, img, c.pet, x, y, w, h, r);
    } else if (s.type === 'qr' && a.qr) {
      ctx.save();
      if (c.preview) ctx.globalAlpha = 0.35;
      ctx.drawImage(a.qr, x, y, w, h);
      ctx.restore();
    } else if (s.type === 'crest' && a.crest) {
      drawContain(ctx, a.crest, x, y, w, h);
    }
  }
}

function drawText(ctx: Ctx, s: TextSlot, c: DocContext, W: number, H: number) {
  let v = fieldValue(s.field, c);
  if (!v) return;
  if (s.upper) v = v.toUpperCase();
  const size = s.size * H;
  const opts = {
    size,
    weight: s.weight ?? 700,
    color: s.color ?? '#1f1a17',
    align: s.align ?? ('left' as CanvasTextAlign),
    family: s.font ?? ('body' as const),
    letterSpacing: s.letterSpacing,
  };
  if (s.lines && s.lines > 1) wrap(ctx, v, s.x * W, s.y * H, s.w * W, size * 1.2, { ...opts, maxLines: s.lines });
  else text(ctx, v, s.x * W, s.y * H, { ...opts, maxWidth: s.w * W });
}
