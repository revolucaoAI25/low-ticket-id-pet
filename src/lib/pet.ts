import type { RgColor } from '@/config/brand';
import { getSpecies, type Species } from './species';

export type Sex = 'macho' | 'femea' | 'nao-sei';
export type Personality = 'aventureiro' | 'dorminhoco' | 'comilao' | 'brincalhao' | 'grudinho';
export type Origin = 'nascimento' | 'adocao';
export type Place = 'praia' | 'parque' | 'sofa' | 'carro' | 'casa-da-vo' | 'trilha';

export interface TeamChoice {
  /** id do time na lista, ou null quando a pessoa digitou um time que não temos. */
  id: string | null;
  name: string;
  none?: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

/** Dados completados depois da compra, na área do pet. */
export interface PetExtras {
  coat?: string;
  size?: string;
  weight?: string;
  microchip?: string;
  rgAnimal?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  food?: string;
  feedingTimes?: string;
  walks?: string;
  habits?: string;
  forbidden?: string;
  vetName?: string;
  vetClinic?: string;
  vetPhone?: string;
  contacts?: EmergencyContact[];
  lostMessage?: string;
  showPhone?: boolean;
  reward?: string;
}

export interface PetData {
  species?: Species;
  name?: string;
  breed?: string;
  sex?: Sex;
  personality?: Personality;
  origin?: Origin;
  date?: string; // AAAA-MM-DD
  place?: Place;
  team?: TeamChoice;
  tutors?: string;
  city?: string;
  rgColor?: RgColor;
  /** Foto: dataURL (no navegador, antes de salvar) ou URL pública (Supabase). */
  photo?: string;
  extras?: PetExtras;
}

export const PERSONALITIES: Record<Personality, { m: string; f: string; emoji: string; hint: string; about: (n: string, o: string) => string }> = {
  aventureiro: {
    m: 'Aventureiro',
    f: 'Aventureira',
    emoji: '🧭',
    hint: 'Quer explorar tudo',
    about: (n, o) => `${n} não perde uma chance de explorar. Rua nova, cheiro novo, gente nova: pra ${o}, tudo é aventura.`,
  },
  dorminhoco: {
    m: 'Dorminhoco',
    f: 'Dorminhoca',
    emoji: '😴',
    hint: 'Especialista em soneca',
    about: (n) => `${n} sabe aproveitar a vida: acha o cantinho mais quentinho da casa e transforma qualquer tarde numa soneca.`,
  },
  comilao: {
    m: 'Comilão',
    f: 'Comilona',
    emoji: '🍗',
    hint: 'Ouve o pacote abrindo de longe',
    about: (n) => `${n} escuta pacote abrindo do outro lado da casa. Comida é amor, e amor nunca é demais.`,
  },
  brincalhao: {
    m: 'Brincalhão',
    f: 'Brincalhona',
    emoji: '🎾',
    hint: 'Energia infinita',
    about: (n) => `${n} tem energia de sobra e sempre um brinquedo por perto. Com essa companhia, não existe dia sem graça.`,
  },
  grudinho: {
    m: 'Grudinho',
    f: 'Grudinha',
    emoji: '🥰',
    hint: 'Sombra do tutor',
    about: (n) => `${n} é a sua sombra: vai aonde você vai, deita onde você deita e faz festa toda vez que você chega.`,
  },
};

export const PLACES: Record<Place, { label: string; emoji: string; stamp: string }> = {
  praia: { label: 'Praia', emoji: '🏖️', stamp: 'PRAIA' },
  parque: { label: 'Parque', emoji: '🌳', stamp: 'PARQUE' },
  sofa: { label: 'Sofá', emoji: '🛋️', stamp: 'SOFÁ' },
  carro: { label: 'Passeio de carro', emoji: '🚗', stamp: 'PASSEIO DE CARRO' },
  'casa-da-vo': { label: 'Casa da vó', emoji: '👵', stamp: 'CASA DA VÓ' },
  trilha: { label: 'Trilha', emoji: '🥾', stamp: 'TRILHA' },
};

export function isFemale(p: PetData): boolean {
  return p.sex === 'femea';
}

/** Nome do pet ou "seu pet" quando não respondeu. */
export function petName(p: PetData): string {
  return p.name?.trim() || 'seu pet';
}

export function hasName(p: PetData): boolean {
  return !!p.name?.trim();
}

/** "do Paçoca", "da Mel" ou "do seu pet". */
export function doPet(p: PetData): string {
  if (!hasName(p)) return 'do seu pet';
  return `${isFemale(p) ? 'da' : 'do'} ${petName(p)}`;
}

/** "o Paçoca", "a Mel" ou "seu pet". */
export function oPet(p: PetData): string {
  if (!hasName(p)) return 'seu pet';
  return `${isFemale(p) ? 'a' : 'o'} ${petName(p)}`;
}

/** Artigo/terminação: g(p, 'o', 'a'). */
export function g(p: PetData, m: string, f: string): string {
  return isFemale(p) ? f : m;
}

export function personalityLabel(p: PetData): string | undefined {
  if (!p.personality) return undefined;
  const d = PERSONALITIES[p.personality];
  return isFemale(p) ? d.f : d.m;
}

export function sexLabel(p: PetData): string {
  if (p.sex === 'macho') return 'Macho';
  if (p.sex === 'femea') return 'Fêmea';
  return '';
}

export function defaultRgColor(p: PetData): RgColor {
  if (p.rgColor) return p.rgColor;
  return p.sex === 'femea' ? 'rosa' : 'azul';
}

export function speciesNoun(p: PetData): string {
  return getSpecies(p.species)?.noun ?? 'pet';
}

/** Texto do template: troca {nome} e {do}. */
export function fill(text: string, p: PetData): string {
  const certidao = p.origin === 'adocao' ? 'Adoção' : p.origin === 'nascimento' ? 'Nascimento' : 'Nascimento ou de Adoção';
  return text
    .replaceAll('{nome}', hasName(p) ? petName(p) : 'seu pet')
    .replaceAll('{do}', doPet(p))
    .replaceAll('{certidao}', certidao);
}

export function formatDateBR(iso?: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function ageYears(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

/** "4 anos" (nascimento) ou "Na família desde 2022" (adoção). */
export function ageLabel(p: PetData): string {
  if (!p.date) return '';
  if (p.origin === 'adocao') return `Na família desde ${p.date.slice(0, 4)}`;
  const a = ageYears(p.date);
  if (a === null) return '';
  return a === 0 ? 'Filhote' : `${a} ${a === 1 ? 'ano' : 'anos'}`;
}

/** Número do RG do Clube (estável por pet). Não imita número de documento público. */
export function clubNumber(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = (h >>> 0).toString().padStart(10, '0').slice(0, 8);
  return `CF ${n.slice(0, 4)}-${n.slice(4, 8)}`;
}
