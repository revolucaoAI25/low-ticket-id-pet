import type { Config } from 'tailwindcss';
import { brand } from './src/config/brand';

const c = brand.colors;

// As cores vêm de src/config/brand.ts (lembre de espelhar em src/app/globals.css se trocar a paleta).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cacau: c.cacau,
        creme: c.creme,
        coral: c.coral,
        salvia: c.salvia,
        roxo: c.roxo,
        'roxo-escuro': c.roxoEscuro,
        mel: c.mel,
        laranja: c.laranja,
        areia: c.areia,
        linha: c.linha,
        verde: c.verde,
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(73,56,47,.04), 0 8px 24px -12px rgba(73,56,47,.25)',
        pop: '0 4px 0 0 var(--c-roxo-escuro)',
        'pop-mel': '0 4px 0 0 #C9820A',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
};
export default config;
