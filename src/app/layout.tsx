import type { Metadata, Viewport } from 'next';
import { brand } from '@/config/brand';
import { Tracking } from '@/components/Tracking';
import { getSettings } from '@/lib/server/settings';
import { fontBody, fontDisplay } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: `${brand.product} · ${brand.name}`,
  description: 'Monte o RG, a certidão, a carteira de vacinação e a tag com QR Code do seu pet em 2 minutos. Prévia grátis.',
  icons: { icon: brand.icon, apple: brand.icon },
  openGraph: {
    title: `${brand.product} · ${brand.name}`,
    description: 'O kit de documentos personalizados do seu pet, com foto e nome. Pronto pra imprimir.',
    images: [brand.logo],
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: brand.colors.creme,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="pt-BR" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="min-h-dvh font-body">
        {children}
        <Tracking
          metaPixelId={settings.tracking.metaPixelId}
          utmifyUtms={settings.tracking.utmifyUtms}
          utmifyPixelId={settings.tracking.utmifyPixelId}
        />
      </body>
    </html>
  );
}
