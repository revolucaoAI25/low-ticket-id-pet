'use client';

import {
  addressLine,
  g,
  PERSONALITIES,
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
import { drawContain, rr, text, wrap } from './draw';
import type { Ctx } from './draw';
import type { Assets, DocContext, DocPage, Slot, TextSlot } from './types';

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
  dia: { label: 'Dia (nasc./adoção)', get: (c) => dateParts(c.pet.date)?.d ?? '' },
  mes: { label: 'Mês (nasc./adoção)', get: (c) => dateParts(c.pet.date)?.m ?? '' },
  ano4: { label: 'Ano (nasc./adoção)', get: (c) => dateParts(c.pet.date)?.y ?? '' },
  hojeDia: { label: 'Dia de hoje', get: () => dateParts(todayIso())!.d },
  hojeMes: { label: 'Mês de hoje', get: () => dateParts(todayIso())!.m },
  hojeAno: { label: 'Ano de hoje', get: () => dateParts(todayIso())!.y },
  cidadeNome: { label: 'Cidade (sem UF)', get: (c) => splitCity(cityOf(c.pet)).city },
  uf: { label: 'UF', get: (c) => splitCity(cityOf(c.pet)).uf },
  xMacho: { label: 'X se macho', get: (c) => (c.pet.sex === 'macho' ? 'X' : '') },
  xFemea: { label: 'X se fêmea', get: (c) => (c.pet.sex === 'femea' ? 'X' : '') },
  observacoes: {
    label: 'Observações (saúde)',
    get: (c) => {
      const e = c.pet.extras ?? {};
      return [e.allergies && `Alergias: ${e.allergies}`, e.medications && `Remédios: ${e.medications}`, e.conditions].filter(Boolean).join(' · ');
    },
  },
  personalidadeTexto: {
    label: 'Personalidade com descrição',
    get: (c) => (c.pet.personality ? `${personalityLabel(c.pet)} · ${PERSONALITIES[c.pet.personality].hint}` : ''),
  },
  enderecoRua: { label: 'Rua e bairro', get: (c) => [c.pet.address?.street, c.pet.address?.district].filter(Boolean).join(' · ') },
  microchipOuRegistro: { label: 'Microchip ou registro', get: (c) => c.pet.extras?.microchip || maskNumber(clubNumber(c.seed), c.preview) },
  docPF: { label: 'Nº do documento (PF…)', get: (c) => maskNumber(`PF${digitsOf(c)}`, c.preview) },
  mrzRG: { label: 'Linha de leitura (RG)', get: (c) => maskNumber(`IDPF${digitsOf(c)}<${mrzName(c)}`.padEnd(40, '<').slice(0, 40), c.preview) },
  mrzRGcor: { label: 'Linha de leitura (RG colorido)', get: (c) => maskNumber(`PF${digitsOf(c)}<${mrzName(c)}`.padEnd(40, '<').slice(0, 40), c.preview) },
  validade: { label: 'Validade (CNH)', get: () => 'ETERNA' },
  habCarro: { label: 'CNH: passeio de carro', get: (c) => hab(c, 'carro') },
  habParque: { label: 'CNH: parque', get: (c) => hab(c, 'parque') },
  habPraia: { label: 'CNH: praia', get: (c) => hab(c, 'praia') },
  habHotel: { label: 'CNH: hotelzinho', get: (c) => hab(c, 'hotel') },
  habCreche: { label: 'CNH: creche', get: (c) => hab(c, 'creche') },
  habCaminhada: { label: 'CNH: caminhada', get: (c) => hab(c, 'caminhada') },
  habViagem: { label: 'CNH: viagem', get: (c) => hab(c, 'viagem') },
  hojeSeHab: { label: 'Data de hoje (se habilitado)', get: () => today() },
  aboutCNH: {
    label: 'Observação divertida da CNH',
    get: (c) => `${g(c.pet, 'Habilitado', 'Habilitada')} a pôr a cabeça pra fora da janela, pedir carinho no trânsito e farejar tudo pelo caminho.`,
  },
  contato2: { label: 'Contato de emergência 2', get: (c) => contact(c, 1) },
};

const dateParts = (iso?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? { d: m[3], m: m[2], y: m[1] } : null;
};
const todayIso = () => new Date().toISOString().slice(0, 10);
/** "Belo Horizonte - MG" → { city: "Belo Horizonte", uf: "MG" } */
function splitCity(s: string): { city: string; uf: string } {
  const m = /^(.*?)[\s,/-]+([A-Za-z]{2})\s*$/.exec(s.trim());
  return m ? { city: m[1].trim(), uf: m[2].toUpperCase() } : { city: s.trim(), uf: '' };
}
const digitsOf = (c: DocContext) => clubNumber(c.seed).replace(/\D/g, '');
const mrzName = (c: DocContext) =>
  (petName(c.pet) === 'seu pet' ? 'PET' : petName(c.pet))
    .toUpperCase()
    .normalize('NFD')
    .replace(/[^A-Z ]/g, '')
    .trim()
    .replace(/\s+/g, '<');

/** Categorias da CNH habilitadas conforme a personalidade. */
const HAB: Record<string, string[]> = {
  aventureiro: ['carro', 'parque', 'praia', 'hotel', 'creche', 'caminhada', 'viagem'],
  brincalhao: ['carro', 'parque', 'praia', 'creche', 'caminhada'],
  grudinho: ['carro', 'parque', 'hotel', 'caminhada', 'viagem'],
  dorminhoco: ['carro', 'hotel', 'viagem'],
  comilao: ['carro', 'parque', 'caminhada', 'viagem'],
};
const hab = (c: DocContext, k: string) => ((HAB[c.pet.personality ?? ''] ?? ['carro', 'parque', 'caminhada']).includes(k) ? g(c.pet, 'HABILITADO', 'HABILITADA') : '');

function contact(c: DocContext, i: number): string {
  const ct = c.pet.extras?.contacts?.[i];
  if (!ct) return '';
  return [ct.name, formatPhone(ct.phone)].filter(Boolean).join(' · ');
}

export function fieldValue(field: string, c: DocContext): string {
  if (field.startsWith('=')) return field.slice(1);
  return FIELDS[field]?.get(c) ?? '';
}

/** Desenha o template e escreve os campos por cima. box = área do template na página (fração). */
export function drawSlots(ctx: Ctx, page: DocPage, c: DocContext, a: Assets, slots: Slot[] = page.slots ?? [], box: [number, number, number, number] = [0, 0, 1, 1]) {
  const W = page.w * box[2];
  const H = page.h * box[3];
  if (box[0] || box[1] || box[2] < 1 || box[3] < 1) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, page.w, page.h);
  }
  ctx.save();
  ctx.translate(page.w * box[0], page.h * box[1]);
  if (a.background) ctx.drawImage(a.background, 0, 0, W, H);
  for (const s of slots) {
    if (s.type === 'text') {
      drawText(ctx, s, c, W, H);
      continue;
    }
    const x = s.x * W;
    const y = s.y * H;
    const w = s.w * W;
    const h = s.h * H;
    if (s.type === 'patch') {
      if (s.when && !fieldValue(s.when, c)) continue;
      rr(ctx, x, y, w, h, (s.radius ?? 0) * h);
      ctx.fillStyle = s.color;
      ctx.fill();
      continue;
    }
    const r = (s.radius ?? 0) * w;
    if (s.type === 'photo' || s.type === 'extraPhoto') {
      const img = s.type === 'extraPhoto' ? a.photos[s.index ?? 0] ?? a.photo : a.photo;
      // Sem foto: mantém a ilustração do próprio template.
      if (!img) continue;
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
  ctx.restore();
}

function drawText(ctx: Ctx, s: TextSlot, c: DocContext, W: number, H: number) {
  let v = fieldValue(s.field, c);
  if (!v) return;
  if (s.when && !fieldValue(s.when, c)) return;
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
  if (s.mono) {
    // Linha de leitura de máquina: fonte mono, encolhe para caber.
    ctx.save();
    let sz = size;
    const font = () => (ctx.font = `700 ${sz}px "OCR B", "Courier New", monospace`);
    font();
    while (ctx.measureText(v).width > s.w * W && sz > size * 0.5) (sz -= 1), font();
    ctx.fillStyle = opts.color;
    ctx.textAlign = 'left';
    ctx.fillText(v, s.x * W, s.y * H);
    ctx.restore();
  } else if (s.lines && s.lines > 1) wrap(ctx, v, s.x * W, s.y * H, s.w * W, size * 1.2, { ...opts, maxLines: s.lines });
  else text(ctx, v, s.x * W, s.y * H, { ...opts, maxWidth: s.w * W });
}
