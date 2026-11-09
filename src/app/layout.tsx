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
  const pixelId = settings.tracking.metaPixelId.replace(/\D/g, '');
  return (
    <html lang="pt-BR" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <head>
        {pixelId ? (
          <>
            <link rel="preconnect" href="https://connect.facebook.net" />
            {/* Pixel no início da página: o PageView sai antes do resto carregar (melhora a taxa de conexão do anúncio). */}
            <script
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
              }}
            />
          </>
        ) : null}
      </head>
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
