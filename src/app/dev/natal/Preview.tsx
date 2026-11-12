'use client';

import { useEffect, useState } from 'react';
import { petPhotos } from '@/lib/natal/base';
import { renderArtes } from '@/lib/natal/artes';
import { Personal } from '@/app/confirmar/[token]/Confirmar';

export function Preview() {
  const [imgs, setImgs] = useState<{ label: string; url: string }[]>([]);
  const [area, setArea] = useState<{ name: string; url: string; kind: string }[] | null>(null);
  useEffect(() => {
    (async () => {
      const q = new URLSearchParams(location.search);
      const pet = q.get('pet') || 'mel';
      const photos = await petPhotos(`/demo/pets/${pet}.jpg`, ['/demo/pets/thor.jpg', '/demo/pets/bob.jpg']);
      const kind = q.get('k') || 'artes';
      if (kind === 'area') {
        const { buildExtras } = await import('@/lib/natal/pacote');
        const vazio = q.get('vazio') === '1';
        const files = vazio ? [] : await buildExtras({ name: 'Mel', sex: 'femea', photo: `/demo/pets/${pet}.jpg` }, ['natal', 'figurinhas']);
        setArea(files.map((f) => ({ name: f.label, url: URL.createObjectURL(f.blob) + (f.name.endsWith('.webp') ? '#.webp' : ''), kind: f.kind })));
      } else if (kind === 'pacote') {
        const { buildExtras } = await import('@/lib/natal/pacote');
        const t0 = performance.now();
        const files = await buildExtras({ name: q.get('nome') || 'Mel', sex: 'femea', photo: `/demo/pets/${pet}.jpg`, extras: { photos: ['/demo/pets/thor.jpg'] } }, ['natal', 'figurinhas']);
        const info = files.map((f) => `${f.name} ${f.kind} ${f.type} ${Math.round(f.blob.size / 1024)}KB`);
        (window as unknown as { __files: string[]; __ms: number }).__files = info;
        (window as unknown as { __ms: number }).__ms = Math.round(performance.now() - t0);
        const pdf = files.find((f) => f.kind === 'natal-pdf');
        if (pdf) (window as unknown as { __pdf: string }).__pdf = URL.createObjectURL(pdf.blob);
        const reader = new FileReader();
        reader.onload = () => ((window as unknown as { __pdf64: string }).__pdf64 = String(reader.result));
        if (pdf) reader.readAsDataURL(pdf.blob);
        setImgs(files.filter((f) => f.type.startsWith('image/')).map((f) => ({ label: f.name, url: URL.createObjectURL(f.blob) })));
      } else if (kind === 'artes') {
        const artes = await renderArtes({ name: q.get('nome') || 'Mel', female: true, photos });
        setImgs(artes.map((a) => ({ label: a.label, url: a.canvas.toDataURL('image/jpeg', 0.9) })));
      } else {
        const { renderFigurinhas } = await import('@/lib/natal/figurinhas');
        const fig = await renderFigurinhas({ name: q.get('nome') || 'Mel', female: true, photos });
        setImgs(fig.map((a) => ({ label: a.label, url: a.canvas.toDataURL('image/png') })));
      }
      document.body.dataset.pronto = '1';
    })();
  }, []);
  if (area)
    return (
      <div className="mx-auto max-w-[520px] px-4 pb-16 pt-4">
        <div className="card mt-5 p-4">
          <Personal
            pet={{ id: 'x', slug: 'x', data: { name: 'Mel', sex: 'femea' }, files: area, submitted: true }}
            extras={[
              { id: 'kit-natal', name: 'Kit Natal e Ano Novo do Seu Pet', kind: 'natal' },
              { id: 'figurinhas', name: 'Figurinhas Personalizadas do Seu Pet', kind: 'figurinhas' },
            ]}
            onGenerate={() => alert('gerar')}
          />
        </div>
      </div>
    );
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, background: '#777' }}>
      {imgs.map((i) => (
        <figure key={i.label} style={{ margin: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={i.url} alt={i.label} style={{ height: 600, display: 'block', background: 'repeating-conic-gradient(#ccc 0 25%, #eee 0 50%) 0 0/20px 20px' }} />
          <figcaption style={{ color: '#fff', font: '14px sans-serif' }}>{i.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
