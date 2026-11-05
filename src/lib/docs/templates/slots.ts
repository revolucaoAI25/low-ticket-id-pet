/**
 * Mapeamento dos campos sobre os templates de imagem (public/templates).
 * Posições em fração do template: x/y/w/h de 0 a 1; y do texto é a linha de base; size = fração da altura.
 * Para conferir/ajustar: /admin → Conferir documentos.
 */
import type { Slot, TextSlot } from '../types';

const INK = '#1B2A44';
const t = (field: string, x: number, y: number, w: number, size: number, o: Partial<TextSlot> = {}): TextSlot => ({
  type: 'text',
  field,
  x,
  y,
  w,
  size,
  color: INK,
  weight: 800,
  upper: true,
  ...o,
});
const c = (field: string, x: number, y: number, size: number, o: Partial<TextSlot> = {}): TextSlot => t(field, x, y, 0.2, size, { align: 'center', ...o });

/* ---------------- RG "República Pet Brasileira" ---------------- */

export const RG_FRENTE: Slot[] = [
  { type: 'photo', x: 0.076, y: 0.234, w: 0.238, h: 0.355, radius: 0.05 },
  t('nome', 0.355, 0.29, 0.575, 0.032),
  t('especie', 0.355, 0.381, 0.24, 0.027),
  t('raca', 0.65, 0.381, 0.28, 0.027),
  c('xMacho', 0.376, 0.468, 0.034, { weight: 900 }),
  c('xFemea', 0.4595, 0.468, 0.034, { weight: 900 }),
  { type: 'patch', x: 0.567, y: 0.44, w: 0.239, h: 0.045, color: '#f6f9ec', radius: 0.3, when: 'data' },
  c('data', 0.686, 0.473, 0.028),
  t('pelagem', 0.355, 0.565, 0.42, 0.027),
  t('tutores', 0.1, 0.672, 0.61, 0.026),
  t('cidade', 0.1, 0.752, 0.61, 0.026),
  t('registro', 0.1, 0.829, 0.61, 0.026),
  { type: 'patch', x: 0.29, y: 0.845, w: 0.222, h: 0.041, color: '#f5faf2', radius: 0.3 },
  c('hoje', 0.4, 0.877, 0.026),
  { type: 'patch', x: 0.787, y: 0.642, w: 0.146, h: 0.2, color: '#f7f8f0', radius: 0.12 },
  { type: 'qr', x: 0.795, y: 0.652, w: 0.13, h: 0.166 },
];

export const RG_VERSO: Slot[] = [
  t('personalidadeTexto', 0.07, 0.166, 0.63, 0.028, { upper: false }),
  t('observacoes', 0.07, 0.297, 0.6, 0.025, { upper: false, lines: 2 }),
  t('telefone', 0.07, 0.461, 0.52, 0.028),
  t('endereco', 0.07, 0.567, 0.52, 0.025, { upper: false, lines: 2 }),
  t('microchipOuRegistro', 0.07, 0.713, 0.52, 0.027),
  { type: 'patch', x: 0.41, y: 0.826, w: 0.535, h: 0.044, color: '#f2f6f5' },
  t('mrzRG', 0.418, 0.86, 0.525, 0.03, { mono: true, weight: 700, color: '#111' }),
];

/* ---------------- RG colorido (azul / rosa / verde) ---------------- */

export const rgCorFrente = (pill: string): Slot[] => [
  { type: 'photo', x: 0.056, y: 0.238, w: 0.245, h: 0.378, radius: 0.05 },
  t('nome', 0.342, 0.292, 0.59, 0.032),
  t('especie', 0.342, 0.385, 0.265, 0.027),
  t('raca', 0.653, 0.385, 0.28, 0.027),
  c('xMacho', 0.364, 0.469, 0.034, { weight: 900 }),
  c('xFemea', 0.454, 0.469, 0.034, { weight: 900 }),
  { type: 'patch', x: 0.559, y: 0.441, w: 0.23, h: 0.045, color: '#f8faf4', radius: 0.3, when: 'data' },
  c('data', 0.673, 0.474, 0.028),
  t('pelagem', 0.342, 0.567, 0.43, 0.027),
  t('tutores', 0.078, 0.696, 0.61, 0.026),
  t('cidade', 0.078, 0.78, 0.61, 0.026),
  t('registro', 0.078, 0.865, 0.61, 0.026),
  { type: 'patch', x: 0.618, y: 0.912, w: 0.218, h: 0.052, color: pill, radius: 0.5 },
  t('docPF', 0.623, 0.951, 0.205, 0.034, { mono: true, weight: 700, color: '#111' }),
  { type: 'patch', x: 0.786, y: 0.648, w: 0.146, h: 0.2, color: '#f8faf2', radius: 0.12 },
  { type: 'qr', x: 0.796, y: 0.66, w: 0.126, h: 0.162 },
];

export const RG_COR_VERSO: Slot[] = [
  t('personalidadeTexto', 0.065, 0.168, 0.65, 0.028, { upper: false }),
  t('observacoes', 0.065, 0.3, 0.6, 0.025, { upper: false, lines: 2 }),
  t('telefone', 0.065, 0.463, 0.52, 0.028),
  t('endereco', 0.065, 0.57, 0.52, 0.025, { upper: false, lines: 2 }),
  t('microchipOuRegistro', 0.065, 0.718, 0.52, 0.027),
  { type: 'patch', x: 0.405, y: 0.828, w: 0.54, h: 0.044, color: '#f9faf3' },
  t('mrzRGcor', 0.412, 0.861, 0.53, 0.03, { mono: true, weight: 700, color: '#111' }),
];

/* ---------------- CNH Pet ---------------- */

export const CNH_FRENTE: Slot[] = [
  t('nome', 0.165, 0.323, 0.6, 0.03),
  t('registroCnh', 0.81, 0.323, 0.16, 0.026),
  { type: 'photo', x: 0.137, y: 0.359, w: 0.281, h: 0.49, radius: 0.05 },
  t('data', 0.452, 0.404, 0.24, 0.026),
  t('cidade', 0.727, 0.404, 0.245, 0.024),
  t('hoje', 0.452, 0.487, 0.16, 0.026),
  t('validade', 0.648, 0.487, 0.16, 0.026),
  t('especie', 0.85, 0.487, 0.12, 0.024),
  t('raca', 0.452, 0.571, 0.35, 0.026),
  t('sexo', 0.85, 0.571, 0.12, 0.024),
  t('tutores', 0.452, 0.658, 0.51, 0.026),
  t('microchip', 0.452, 0.744, 0.33, 0.026),
  t('cidade', 0.452, 0.825, 0.33, 0.026),
  { type: 'patch', x: 0.836, y: 0.742, w: 0.118, h: 0.165, color: '#ecf7f7', radius: 0.08 },
  { type: 'qr', x: 0.845, y: 0.753, w: 0.1, h: 0.1435 },
];

const HAB_ROWS: [string, number][] = [
  ['habCarro', 0.152],
  ['habParque', 0.199],
  ['habPraia', 0.246],
  ['habHotel', 0.293],
  ['habCreche', 0.341],
  ['habCaminhada', 0.39],
  ['habViagem', 0.44],
];

export const CNH_VERSO: Slot[] = [
  ...HAB_ROWS.flatMap(([f, y]): Slot[] => [
    c(f, 0.4975, y, 0.022, { color: '#1E6B3A', weight: 900 }),
    c('hoje', 0.6645, y, 0.021, { when: f }),
  ]),
  t('aboutCNH', 0.165, 0.555, 0.48, 0.026, { upper: false, lines: 3, weight: 700 }),
  t('cidade', 0.16, 0.815, 0.48, 0.026),
];

/* ---------------- Certidões ---------------- */

export const CERT_NASCIMENTO: Slot[] = [
  t('nome', 0.125, 0.39, 0.75, 0.02),
  c('dia', 0.148, 0.459, 0.018),
  c('mes', 0.231, 0.459, 0.018),
  c('ano4', 0.337, 0.459, 0.018),
  t('especie', 0.44, 0.456, 0.2, 0.017),
  t('raca', 0.668, 0.456, 0.215, 0.017),
  t('sexo', 0.125, 0.518, 0.23, 0.017),
  t('cidadeNome', 0.405, 0.518, 0.39, 0.017),
  c('uf', 0.854, 0.518, 0.017),
  t('tutores', 0.125, 0.585, 0.75, 0.018),
  t('observacoes', 0.125, 0.656, 0.75, 0.015, { upper: false, lines: 2, weight: 700 }),
  { type: 'patch', x: 0.748, y: 0.751, w: 0.105, h: 0.067, color: '#f7fdf4', radius: 0.08 },
  { type: 'qr', x: 0.7585, y: 0.753, w: 0.083, h: 0.062 },
  c('cidadeNome', 0.262, 0.852, 0.014, { upper: false, weight: 700 }),
  c('hojeDia', 0.45, 0.858, 0.014),
  c('hojeMes', 0.528, 0.858, 0.014),
  c('hojeAno', 0.618, 0.858, 0.014),
];

export const CERT_ADOCAO: Slot[] = [
  t('nome', 0.118, 0.363, 0.77, 0.02),
  c('dia', 0.142, 0.43, 0.018),
  c('mes', 0.228, 0.43, 0.018),
  c('ano4', 0.335, 0.43, 0.018),
  t('especie', 0.435, 0.427, 0.2, 0.017),
  t('raca', 0.675, 0.427, 0.21, 0.017),
  c('xMacho', 0.123, 0.481, 0.02, { weight: 900 }),
  c('xFemea', 0.267, 0.481, 0.02, { weight: 900 }),
  t('cidadeNome', 0.405, 0.484, 0.39, 0.017),
  c('uf', 0.86, 0.484, 0.017),
  t('tutores', 0.118, 0.538, 0.77, 0.018),
  t('observacoes', 0.118, 0.597, 0.77, 0.015, { upper: false, lines: 2, weight: 700 }),
  c('hojeDia', 0.152, 0.686, 0.017),
  c('hojeMes', 0.26, 0.686, 0.017),
  c('hojeAno', 0.377, 0.686, 0.017),
  c('registro', 0.72, 0.68, 0.018),
  { type: 'patch', x: 0.757, y: 0.745, w: 0.112, h: 0.063, color: '#f3fcf0', radius: 0.08 },
  { type: 'qr', x: 0.774, y: 0.749, w: 0.078, h: 0.055 },
  c('cidadeNome', 0.268, 0.843, 0.014, { upper: false, weight: 700 }),
  c('hojeDia', 0.474, 0.847, 0.014),
  c('hojeMes', 0.561, 0.847, 0.014),
  c('hojeAno', 0.656, 0.847, 0.014),
];
