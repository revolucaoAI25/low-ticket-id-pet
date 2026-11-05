'use client';

import { useState } from 'react';

export function FoundButtons({ phone, name, lost }: { phone: string; name: string; lost: boolean }) {
  const [locating, setLocating] = useState(false);
  const d = phone.replace(/\D/g, '');
  const intl = d.startsWith('55') ? d : `55${d}`;
  const hello = `Olá! Encontrei ${name} pela tag do Clube do Focinho.`;
  const wa = (text: string) => `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;

  function sendLocation() {
    if (!navigator.geolocation) {
      window.location.href = wa(hello);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        window.location.href = wa(`${hello} Estou aqui: https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`);
      },
      () => {
        setLocating(false);
        window.location.href = wa(hello);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!d) return null;
  return (
    <div className="grid gap-3">
      {lost && (
        <button type="button" onClick={sendLocation} className="btn w-full bg-red-600 text-white shadow-[0_4px_0_0_#991b1b]">
          {locating ? 'Pegando sua localização…' : '📍 Enviar minha localização ao tutor'}
        </button>
      )}
      <a href={wa(hello)} className="btn w-full bg-[#25D366] text-white shadow-[0_4px_0_0_#128C7E]">
        💬 Chamar no WhatsApp
      </a>
      <a href={`tel:+${intl}`} className="btn-primary w-full">
        📞 Ligar para meu tutor
      </a>
      {!lost && (
        <button type="button" onClick={sendLocation} className="btn-ghost w-full !text-base">
          📍 Enviar onde me encontrou
        </button>
      )}
    </div>
  );
}
