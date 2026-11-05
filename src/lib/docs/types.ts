import type { PetData } from '@/lib/pet';
import type { Team } from '@/lib/teams';
import type { Ctx } from './draw';

/** Tudo que um documento precisa para ser desenhado. */
export interface DocContext {
  pet: PetData;
  /** Semente do número do RG do Clube (id do pet ou do navegador). */
  seed: string;
  /** Código do pet, usado no link do QR Code (ex.: pacoca-7k2m9x). */
  slug?: string;
  siteUrl: string;
  /** Time resolvido a partir da escolha do quiz. */
  team?: Team;
  /** Telefone principal do tutor (do contato do quiz). */
  phone?: string;
  /** Fundos prontos enviados pelo painel, por id de página (têm prioridade sobre o arquivo do projeto). */
  templates?: Record<string, string>;
  /** true = prévia (marca d'água e número escondido). */
  preview?: boolean;
}

export interface Assets {
  photo: HTMLImageElement | null;
  /** Fotos extras (bônus). */
  photos: HTMLImageElement[];
  crest: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  qr: HTMLCanvasElement | null;
  /** Fundo pronto (template) desta página, se houver. */
  background: HTMLImageElement | null;
}

/* ---------- Mapeamento de campos sobre o template ---------- */

/**
 * Posições em fração da página (0 a 1): x/y/w/h relativos à largura/altura do template.
 * Assim o mapeamento vale para qualquer resolução da imagem.
 */
export interface TextSlot {
  type: 'text';
  /** Campo do pet (ver FIELDS em layout.ts) ou texto fixo com "=" na frente (ex.: "=ETERNA"). */
  field: string;
  x: number;
  y: number;
  w: number;
  /** Tamanho da letra em fração da altura da página. */
  size: number;
  weight?: number;
  color?: string;
  align?: CanvasTextAlign;
  font?: 'display' | 'body';
  upper?: boolean;
  /** Quebra em até N linhas (com altura de linha = size * 1.2). */
  lines?: number;
  letterSpacing?: number;
}

export interface BoxSlot {
  type: 'photo' | 'qr' | 'crest' | 'extraPhoto';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Arredondamento em fração da largura do slot (0.5 = círculo). */
  radius?: number;
  /** Para extraPhoto: qual foto extra (0, 1, 2). Sem foto extra, usa a principal. */
  index?: number;
}

export type Slot = TextSlot | BoxSlot;

export interface DocPage {
  /** id único (também é a chave do template de fundo no painel). */
  id: string;
  label: string;
  /** Tamanho lógico de desenho (siga a proporção do template). */
  w: number;
  h: number;
  /** Tamanho impresso em milímetros. */
  mm: [number, number];
  /** Cópias extras na folha de impressão (tamanhos em mm). Padrão: uma cópia no tamanho mm. */
  printCopies?: [number, number][];
  /** Formato recortado (não leva linha de corte retangular). */
  shape?: 'round' | 'bone';
  needsQr?: boolean;
  needsCrest?: boolean;
  /** Imagem do template dentro do projeto (ex.: "/templates/rg-frente.png"). */
  template?: string;
  /** Campos escritos sobre o template. Com template + slots, o desenho provisório é ignorado. */
  slots?: Slot[];
  /** Desenho provisório em código (usado enquanto não há template). */
  draw: (ctx: Ctx, c: DocContext, a: Assets) => void;
}

export interface DocDef {
  id: string;
  title: string;
  /** Nome do arquivo (sem extensão). {nome} é trocado. */
  file: string;
  pages: DocPage[];
}
