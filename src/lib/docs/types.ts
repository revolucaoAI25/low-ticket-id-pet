import type { PetData } from '@/lib/pet';
import type { Team } from '@/lib/teams';
import type { Ctx } from './draw';

/** Tudo que um documento precisa para ser desenhado. */
export interface DocContext {
  pet: PetData;
  /** Semente do número do RG do Clube (id do pet ou do navegador). */
  seed: string;
  /** Código da página pública do QR (ex.: pacoca-7k2m). */
  slug?: string;
  siteUrl: string;
  /** Time resolvido a partir da escolha do quiz. */
  team?: Team;
  /** Telefone do tutor (verso do RG, tag, ficha). */
  phone?: string;
  /** Fundos prontos (templates da IA de imagens), por id de página. */
  templates?: Record<string, string>;
  /** true = prévia (marca d'água e número escondido). */
  preview?: boolean;
}

export interface Assets {
  photo: HTMLImageElement | null;
  crest: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  qr: HTMLCanvasElement | null;
  /** Fundo pronto desta página, se houver. */
  background: HTMLImageElement | null;
}

export interface DocPage {
  /** id único (também é a chave do template de fundo no painel). */
  id: string;
  label: string;
  /** Tamanho lógico de desenho. */
  w: number;
  h: number;
  /** Tamanho impresso em milímetros. */
  mm: [number, number];
  /** Cópias extras na folha de impressão (tamanhos em mm). Padrão: uma cópia no tamanho mm. */
  printCopies?: [number, number][];
  /** Formato redondo (corta em círculo). */
  round?: boolean;
  needsQr?: boolean;
  needsCrest?: boolean;
  draw: (ctx: Ctx, c: DocContext, a: Assets) => void;
}

export interface DocDef {
  id: string;
  title: string;
  /** Nome do arquivo (sem extensão). {nome} é trocado. */
  file: string;
  pages: DocPage[];
}
