'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { captureUtms } from '@/lib/tracking';

interface Props {
  metaPixelId: string;
  utmifyUtms: boolean;
  utmifyPixelId: string;
}

/** Pixel da Meta + scripts da Utmify. IDs vêm do painel /admin. */
export function Tracking({ metaPixelId, utmifyUtms, utmifyPixelId }: Props) {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    captureUtms();
  }, []);

  // PageView nas trocas de página dentro do site (a primeira já sai no init do pixel).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname]);

  const pixelId = metaPixelId.replace(/\D/g, '');
  const utmifyId = utmifyPixelId.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <>
      {pixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} />
          </noscript>
        </>
      )}
      {utmifyUtms && (
        // Mesmo script que a Utmify gera no painel dela (o código embaralhado só carrega este arquivo com estes atributos).
        <Script
          id="utmify-utms"
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          strategy="afterInteractive"
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
        />
      )}
      {utmifyId && (
        <Script id="utmify-pixel" strategy="afterInteractive">
          {`window.pixelId="${utmifyId}";var a=document.createElement("script");a.setAttribute("async","");a.setAttribute("defer","");a.setAttribute("src","https://cdn.utmify.com.br/scripts/pixel/pixel.js");document.head.appendChild(a);`}
        </Script>
      )}
    </>
  );
}
