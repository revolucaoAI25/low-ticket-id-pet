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

/** Cores neutras da tag em formato de ossinho. */
export const tagColors = { base: '#EAD9BF', light: '#F6EDE0', dark: '#8A6A4A', ink: '#4A3626' } as const;
