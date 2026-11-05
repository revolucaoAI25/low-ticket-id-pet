import { getSpecies, type Species } from './species';

export type Sex = 'macho' | 'femea' | 'nao-sei';
export type Personality = 'aventureiro' | 'dorminhoco' | 'comilao' | 'brincalhao' | 'grudinho';
export type Origin = 'nascimento' | 'adocao';

export interface TeamChoice {
  /** id do time na lista, ou null quando a pessoa digitou um time que não temos. */
  id: string | null;
  name: string;
  none?: boolean;
}

export interface Tutor {
  name: string;
  phone?: string;
}

export interface Address {
  street?: string;
  district?: string;
  city?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

/** Dados completados uma vez, na página de confirmação depois da compra. */
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
  /** Cor favorita (hex), usada nos bônus. */
  favoriteColor?: string;
  /** Fotos extras (URLs ou dataURLs), usadas nos bônus. */
  photos?: string[];
}

export interface PetData {
  species?: Species;
  name?: string;
  breed?: string;
  sex?: Sex;
  personality?: Personality;
  origin?: Origin;
  date?: string; // AAAA-MM-DD
  team?: TeamChoice;
  tutors?: Tutor[];
  address?: Address;
  /** Foto: dataURL (no navegador, antes de salvar) ou URL pública (Supabase). */
  photo?: string;
  extras?: PetExtras;
}

export const PERSONALITIES: Record<Personality, { m: string; f: string; hint: string; about: (n: string, o: string) => string }> = {
  aventureiro: {
    m: 'Aventureiro',
    f: 'Aventureira',
    hint: 'Quer explorar tudo',
    about: (n, o) => `${n} não perde uma chance de explorar. Rua nova, cheiro novo, gente nova: pra ${o}, tudo é aventura.`,
  },
  dorminhoco: {
    m: 'Dorminhoco',
    f: 'Dorminhoca',
    hint: 'Especialista em soneca',
    about: (n) => `${n} sabe aproveitar a vida: acha o cantinho mais quentinho da casa e transforma qualquer tarde numa soneca.`,
  },
  comilao: {
    m: 'Comilão',
    f: 'Comilona',
    hint: 'Ouve o pacote abrindo de longe',
    about: (n) => `${n} escuta pacote abrindo do outro lado da casa. Comida é amor, e amor nunca é demais.`,
  },
  brincalhao: {
    m: 'Brincalhão',
    f: 'Brincalhona',
    hint: 'Energia infinita',
    about: (n) => `${n} tem energia de sobra e sempre um brinquedo por perto. Com essa companhia, não existe dia sem graça.`,
  },
  grudinho: {
    m: 'Grudinho',
    f: 'Grudinha',
    hint: 'Sombra do tutor',
    about: (n) => `${n} é a sua sombra: vai aonde você vai, deita onde você deita e faz festa toda vez que você chega.`,
  },
};

/** Cores que a pessoa pode escolher como favorita (bônus). */
export const FAVORITE_COLORS: { id: string; label: string; hex: string }[] = [
  { id: 'rosa', label: 'Rosa', hex: '#E8789E' },
  { id: 'azul', label: 'Azul', hex: '#4D8FD6' },
  { id: 'verde', label: 'Verde', hex: '#4FA36F' },
  { id: 'amarelo', label: 'Amarelo', hex: '#EDB12C' },
  { id: 'laranja', label: 'Laranja', hex: '#E8833A' },
  { id: 'vermelho', label: 'Vermelho', hex: '#D9534F' },
  { id: 'roxo', label: 'Roxo', hex: '#8A4BA0' },
  { id: 'lilas', label: 'Lilás', hex: '#B79AD9' },
];

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

export function speciesNoun(p: PetData): string {
  return getSpecies(p.species)?.noun ?? 'pet';
}

/** Nomes dos tutores separados por vírgula ("Ana, Léo e Bia"). */
export function tutorNames(p: PetData): string {
  const names = (p.tutors ?? []).map((t) => t.name.trim()).filter(Boolean);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export function cityOf(p: PetData): string {
  return p.address?.city?.trim() ?? '';
}

export function addressLine(p: PetData): string {
  const a = p.address ?? {};
  return [a.street, a.district, a.city].map((s) => s?.trim()).filter(Boolean).join(' · ');
}

/** Texto do template: troca {nome}, {do} e {certidao}. */
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
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}`;
}

/** Converte dados antigos (tutores em texto, cidade solta) para o formato atual. */
export function normalizePet(raw: unknown): PetData {
  const p = (raw && typeof raw === 'object' ? raw : {}) as PetData & { tutors?: unknown; city?: unknown };
  const out: PetData = { ...p };
  if (typeof p.tutors === 'string') {
    out.tutors = (p.tutors as string)
      .split(/,| e /i)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }
  if (typeof p.city === 'string' && !out.address?.city) out.address = { ...(out.address ?? {}), city: p.city };
  delete (out as Record<string, unknown>).city;
  delete (out as Record<string, unknown>).place;
  delete (out as Record<string, unknown>).rgColor;
  return out;
}
