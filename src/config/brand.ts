/**
 * Identidade visual do Clube do Focinho — tudo num lugar só.
 * Trocou a paleta, a logo ou as fontes? Mude aqui (e as fontes em src/app/fonts.ts).
 */
export const brand = {
  name: 'Clube do Focinho',
  product: 'Kit Identidade Pet',
  logo: '/brand/logo.png',
  icon: '/brand/icon.png',
  colors: {
    cacau: '#49382F',
    creme: '#FFF8EF',
    coral: '#E9A092',
    salvia: '#A9BAA6',
    roxo: '#6F2A7A',
    roxoEscuro: '#4E1C57',
    mel: '#F5A524',
    laranja: '#E8833A',
    areia: '#F6E9DA',
    linha: '#EADBC8',
    verde: '#2F9E5B',
  },
} as const;

/** Cores do RG. A cor padrão sai pelo sexo (macho → azul, fêmea → rosa). */
export const rgColors = {
  azul: { label: 'Azul', main: '#3D7DC8', dark: '#22528C', light: '#E1EEFB' },
  rosa: { label: 'Rosa', main: '#E06C98', dark: '#A83A66', light: '#FCE6EF' },
  verde: { label: 'Verde', main: '#3E9A68', dark: '#256B45', light: '#E0F2E7' },
  amarelo: { label: 'Amarelo', main: '#E8A21E', dark: '#9E6A06', light: '#FFF3D1' },
  roxo: { label: 'Roxo', main: '#7A3388', dark: '#4E1C57', light: '#F2E3F5' },
} as const;

export type RgColor = keyof typeof rgColors;
