/**
 * Plano de impressão do PDF único: a ordem das folhas e onde cada peça pequena fica na folha A4.
 * Medidas em mm (A4 = 210 × 297). Mudou a ordem? O sumário e as instruções se atualizam sozinhos
 * (os números de página saem daqui).
 */

export interface Place {
  /** id da página do documento (ex.: 'rg-frente'). */
  page: string;
  /** Índice em printCopies (tags em vários tamanhos). */
  copy?: number;
  x: number;
  y: number;
  caption: string;
}

export interface Note {
  text: string;
  x: number;
  y: number;
  kind: 'section' | 'note';
}

export type Sheet =
  | { kind: 'page'; key: string; page: string }
  | {
      kind: 'pieces';
      key: string;
      title: string;
      hint: string;
      places: Place[];
      notes?: Note[];
      /** Régua de 5 cm para conferir se imprimiu em tamanho real. */
      ruler?: boolean;
      /** Quadro de passo a passo no rodapé da folha. */
      steps?: { title: string; y: number; items: string[] };
    };

const RG_X = [15, 109];
const RG_Y = [41, 122, 203];

/** Folhas do PDF, na ordem. Os PDFs prontos (bônus fixos e order bumps) entram depois da última. */
export const PRINT_PLAN: Sheet[] = [
  { kind: 'page', key: 'capa', page: 'guia-capa' },
  { kind: 'page', key: 'sumario', page: 'guia-sumario' },
  { kind: 'page', key: 'antes', page: 'guia-antes' },
  { kind: 'page', key: 'montar-docs', page: 'guia-montar-docs' },
  { kind: 'page', key: 'montar-mais', page: 'guia-montar-mais' },

  { kind: 'page', key: 'certidao', page: 'certidao' },
  {
    kind: 'pieces',
    key: 'rg',
    title: 'RG do Pet',
    hint: '3 versões. Recorte na linha pontilhada, cole cada frente no verso da mesma linha e plastifique.',
    ruler: true,
    places: [
      { page: 'rg-frente', x: RG_X[0], y: RG_Y[0], caption: 'RG verde · frente' },
      { page: 'rg-verso', x: RG_X[1], y: RG_Y[0], caption: 'RG verde · verso' },
      { page: 'rg-cor-frente', x: RG_X[0], y: RG_Y[1], caption: 'RG colorido · frente' },
      { page: 'rg-cor-verso', x: RG_X[1], y: RG_Y[1], caption: 'RG colorido · verso' },
      { page: 'rg-br-frente', x: RG_X[0], y: RG_Y[2], caption: 'RG República Pet · frente' },
      { page: 'rg-br-verso', x: RG_X[1], y: RG_Y[2], caption: 'RG República Pet · verso' },
    ],
  },
  {
    kind: 'pieces',
    key: 'bolso',
    title: 'CNH, Torcedor e Ficha de Identificação',
    hint: 'Recorte, cole a frente no verso e plastifique. A ficha é uma peça só, sem verso.',
    places: [
      { page: 'cnh-frente', x: 7, y: 41, caption: 'CNH Pet · frente' },
      { page: 'cnh-verso', x: 7, y: 122, caption: 'CNH Pet · verso' },
      { page: 'ficha', x: 113, y: 41, caption: 'Ficha de identificação' },
      { page: 'torcedor-frente', x: 15.4, y: 213, caption: 'Carteirinha de Torcedor · frente' },
      { page: 'torcedor-verso', x: 109, y: 213, caption: 'Carteirinha de Torcedor · verso' },
    ],
  },
  {
    kind: 'pieces',
    key: 'tag',
    title: 'Tag Ossinho com QR Code',
    hint: '3 tamanhos (G, M e P), 2 de cada. Cada nome tem o QR Code do mesmo tamanho logo abaixo.',
    places: [
      { page: 'tag-nome', copy: 0, x: 11, y: 41, caption: 'G · frente' },
      { page: 'tag-nome', copy: 1, x: 79, y: 41, caption: 'G · frente' },
      { page: 'tag-nome', copy: 2, x: 147, y: 41, caption: 'M · frente' },
      { page: 'tag-qr', copy: 0, x: 11, y: 87, caption: 'G · verso' },
      { page: 'tag-qr', copy: 1, x: 79, y: 87, caption: 'G · verso' },
      { page: 'tag-qr', copy: 2, x: 147, y: 87, caption: 'M · verso' },
      { page: 'tag-nome', copy: 3, x: 26, y: 136, caption: 'M · frente' },
      { page: 'tag-nome', copy: 4, x: 86, y: 136, caption: 'P · frente' },
      { page: 'tag-nome', copy: 5, x: 139, y: 136, caption: 'P · frente' },
      { page: 'tag-qr', copy: 3, x: 26, y: 177, caption: 'M · verso' },
      { page: 'tag-qr', copy: 4, x: 86, y: 177, caption: 'P · verso' },
      { page: 'tag-qr', copy: 5, x: 139, y: 177, caption: 'P · verso' },
    ],
    steps: {
      title: 'Como montar a tag',
      y: 216,
      items: [
        'Escolha o tamanho que combina com a coleira e recorte a frente (nome) e o verso (QR Code) dele.',
        'Cole um no outro, costas com costas, com cola bastão ou fita dupla face.',
        'Plastifique e recorte deixando 2 mm de plástico em volta (assim não descola).',
        'Fure na bolinha marcada e prenda na coleira com uma argola de chaveiro.',
        'Teste: aponte a câmera do celular para o QR Code. Tem que abrir a identidade com o seu contato.',
      ],
    },
  },
  { kind: 'page', key: 'passaporte-capa', page: 'passaporte-capa' },
  { kind: 'page', key: 'passaporte-miolo-1', page: 'passaporte-miolo-1' },
  { kind: 'page', key: 'passaporte-miolo-2', page: 'passaporte-miolo-2' },
  { kind: 'page', key: 'vacina-fora', page: 'vacina-fora' },
  { kind: 'page', key: 'vacina-dentro', page: 'vacina-dentro' },

  {
    kind: 'pieces',
    key: 'convite',
    title: 'Convite de aniversário',
    hint: 'Recorte na linha pontilhada. Dica: tire uma foto do convite pronto e mande também pelo WhatsApp.',
    places: [{ page: 'aniv-convite', x: 31, y: 58, caption: 'Convite (tamanho A5)' }],
  },
  { kind: 'page', key: 'aniv-topo', page: 'aniv-topo' },
  { kind: 'page', key: 'aniv-plaquinhas', page: 'aniv-plaquinhas' },
  { kind: 'page', key: 'aniv-certificado', page: 'aniv-certificado' },
  { kind: 'page', key: 'quemcuida', page: 'quemcuida' },
];

/** Número da página (1 = capa) de uma folha do plano. */
export function pageOf(key: string): number {
  return PRINT_PLAN.findIndex((s) => s.key === key) + 1;
}

/** "pág. 7" ou "págs. 10 a 12". */
export function pagesLabel(from: string, to?: string): string {
  const a = pageOf(from);
  const b = to ? pageOf(to) : a;
  if (b === a) return `pág. ${a}`;
  return b === a + 1 ? `págs. ${a} e ${b}` : `págs. ${a} a ${b}`;
}

/** Primeira página depois do plano (onde começam os PDFs prontos). */
export const EXTRAS_START = PRINT_PLAN.length + 1;
