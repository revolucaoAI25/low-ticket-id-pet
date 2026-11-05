import localFont from 'next/font/local';

// Fontes da marca (títulos Fredoka, textos Nunito), guardadas no projeto:
// o build não depende de baixar nada do Google na hora do deploy.
export const fontDisplay = localFont({
  src: [
    { path: './fonts/fredoka-latin-wght-normal.woff2', weight: '300 700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const fontBody = localFont({
  src: [
    { path: './fonts/nunito-latin-wght-normal.woff2', weight: '200 1000', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
