import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SAMPLE_PET } from '@/lib/sample';
import { Logo } from '@/components/ui';
import { formatPhone } from '@/lib/format';
import { PERSONALITIES, ageLabel, g, isFemale, petName, sexLabel, type PetData } from '@/lib/pet';
import { db } from '@/lib/server/supabase';
import { getSpecies } from '@/lib/species';
import { FoundButtons } from './FoundButtons';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Página do pet · Clube do Focinho', robots: { index: false, follow: false } };

interface View {
  data: PetData;
  photo: string | null;
  lost: boolean;
  lostSince: string | null;
  phone: string;
}

async function load(slug: string): Promise<View | 'inactive' | null> {
  if (slug === 'exemplo') return { data: SAMPLE_PET, photo: null, lost: false, lostSince: null, phone: '' };
  const sb = db();
  if (!sb) return null;
  const { data } = await sb
    .from('pets')
    .select('data, photo_url, lost_mode, lost_since, customers(phone, paid_at, refunded_at)')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const c = (data as unknown as { customers: { phone: string | null; paid_at: string | null; refunded_at: string | null } | null }).customers;
  if (!c?.paid_at || c.refunded_at) return 'inactive';
  return { data: data.data as PetData, photo: data.photo_url, lost: data.lost_mode, lostSince: data.lost_since, phone: c.phone ?? '' };
}

export default async function PetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await load(slug);
  if (!v) notFound();
  if (v === 'inactive')
    return (
      <div className="mx-auto max-w-[480px] px-4 py-10 text-center">
        <Logo size={120} />
        <h1 className="h-display mt-6 text-2xl">Esta página ainda não foi ativada</h1>
        <p className="mt-2 font-semibold text-cacau/70">Se você encontrou este pet, procure um veterinário ou pet shop próximo: eles podem ler o microchip.</p>
      </div>
    );

  const p = v.data;
  const ex = p.extras ?? {};
  const name = petName(p) === 'seu pet' ? 'este pet' : petName(p);
  const species = getSpecies(p.species);
  const persona = p.personality ? PERSONALITIES[p.personality] : undefined;
  const showPhone = ex.showPhone !== false;
  const contacts = (ex.contacts ?? []).filter((c) => c.phone);
  const health = [ex.allergies && `Alergias: ${ex.allergies}`, ex.medications && `Remédios: ${ex.medications}`, ex.conditions && ex.conditions].filter(Boolean) as string[];

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] pb-12">
      {v.lost ? (
        <div className="bg-red-600 px-4 py-5 text-center text-white">
          <p className="font-display text-3xl font-semibold">🚨 ESTOU {g(p, 'PERDIDO', 'PERDIDA').toUpperCase()}!</p>
          <p className="mt-1 font-bold">Me ajude a voltar pra casa. Fale com meu tutor agora.</p>
          {v.lostSince && <p className="mt-1 text-sm font-bold opacity-90">Desde {new Date(v.lostSince).toLocaleDateString('pt-BR')}</p>}
          {ex.reward && <p className="mx-auto mt-3 w-fit rounded-full bg-white px-4 py-1 text-sm font-extrabold text-red-700">🎁 Recompensa: {ex.reward}</p>}
        </div>
      ) : (
        <div className="flex justify-center pt-4">
          <Logo size={90} />
        </div>
      )}

      <div className="px-4">
        <div className="card -mt-0 mt-5 overflow-hidden">
          <div className="relative aspect-square bg-areia">
            {v.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.photo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[140px]">{species?.emoji ?? '🐾'}</div>
            )}
          </div>
          <div className="p-5 text-center">
            <p className="text-sm font-extrabold uppercase tracking-widest text-coral">{v.lost ? 'Pet procurado' : `Olá! Eu sou ${isFemale(p) ? 'a' : 'o'}`}</p>
            <h1 className="h-display text-5xl">{name}</h1>
            <p className="mt-2 font-bold text-cacau/70">{[species?.label, p.breed, sexLabel(p), ageLabel(p)].filter(Boolean).join(' · ')}</p>
            {persona && (
              <p className="mt-2 inline-block rounded-full bg-areia px-3 py-1 text-sm font-bold">
                {persona.emoji} {g(p, persona.m, persona.f)}
              </p>
            )}
            {ex.coat && <p className="mt-2 text-sm font-semibold text-cacau/70">Sinais: {ex.coat}</p>}
          </div>
        </div>

        {ex.lostMessage && (
          <div className={`mt-4 rounded-3xl p-4 text-[15px] font-semibold ${v.lost ? 'border-2 border-red-300 bg-red-50' : 'card'}`}>💬 {ex.lostMessage}</div>
        )}

        <div className="card mt-4 p-5">
          <p className="font-display text-xl font-semibold">Se me encontrou, fale com meu tutor</p>
          {p.tutors && <p className="mt-1 font-bold text-cacau/70">Tutores: {p.tutors}</p>}
          {showPhone && v.phone && <p className="mt-1 text-2xl font-extrabold text-roxo">{formatPhone(v.phone)}</p>}
          <div className="mt-4">
            <FoundButtons phone={v.phone} name={name} lost={v.lost} />
          </div>
          {slug === 'exemplo' && <p className="mt-3 text-center text-sm font-bold text-cacau/50">Página de exemplo: os botões aparecem na página real do pet.</p>}
        </div>

        {contacts.length > 0 && (
          <div className="card mt-4 p-5">
            <p className="font-display text-lg font-semibold">Outros contatos</p>
            <ul className="mt-2 space-y-2">
              {contacts.map((c, i) => (
                <li key={i} className="flex items-center justify-between gap-3 font-bold">
                  <span>
                    {c.name}
                    {c.relation ? <span className="text-cacau/60"> · {c.relation}</span> : null}
                  </span>
                  <a href={`tel:${c.phone.replace(/\D/g, '')}`} className="shrink-0 text-roxo underline">
                    {formatPhone(c.phone)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(health.length > 0 || ex.vetName || ex.vetClinic) && (
          <div className="card mt-4 p-5">
            <p className="font-display text-lg font-semibold">🩺 Saúde</p>
            {health.map((h) => (
              <p key={h} className="mt-1 font-semibold">
                {h}
              </p>
            ))}
            {(ex.vetName || ex.vetClinic) && (
              <p className="mt-2 font-semibold">
                Veterinário: {[ex.vetName, ex.vetClinic].filter(Boolean).join(' · ')}
                {ex.vetPhone && (
                  <>
                    {' · '}
                    <a className="text-roxo underline" href={`tel:${ex.vetPhone.replace(/\D/g, '')}`}>
                      {formatPhone(ex.vetPhone)}
                    </a>
                  </>
                )}
              </p>
            )}
            {ex.microchip && <p className="mt-1 font-semibold">Microchip: {ex.microchip}</p>}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-cacau/60">Página criada com o Kit Identidade Pet</p>
          <Link href="/" className="mt-2 inline-block font-extrabold text-roxo underline">
            🐾 Crie a página do seu pet também
          </Link>
        </div>
      </div>
    </div>
  );
}
