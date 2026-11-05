import { Fredoka, Nunito } from 'next/font/google';

// Fontes da marca (guia de identidade: títulos Fredoka, textos Nunito).
export const fontDisplay = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const fontBody = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap',
});
