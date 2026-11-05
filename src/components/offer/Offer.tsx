'use client';

import { ArrowRight, BadgePercent, Bone, Car, Check, CreditCard, FileText, Gift, IdCard, Lock, Mail, PawPrint, Plane, Printer, ShieldCheck, Syringe, Timer, Trophy, Zap, type LucideIcon } from 'lucide-react';
import { ExampleDocs } from './ExampleDocs';
import { ExitIntent } from './ExitIntent';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bonusItems, fullTotal, kitItems } from '@/config/offer';
import { proofSlots, type SiteSettings } from '@/config/site';
import { DocImage } from '@/components/DocImage';
import { Avatar, Logo, Slot, Stars, formatBRL, formatInt } from '@/components/ui';
import { buildDocContext } from '@/lib/doc-context';
import { PERSONALITIES, doPet, fill, hasName, personalityLabel, petName } from '@/lib/pet';
import { PERSONALITY_ICON, SPECIES_ICON } from '@/components/icons';
import { useHydrated, useQuiz } from '@/lib/quiz-store';
import { checkoutGroup, getSpecies } from '@/lib/species';
import { allTeams, findTeam } from '@/lib/teams';
import { buildCheckoutUrl, track } from '@/lib/tracking';
import { useCountdown } from './useCountdown';


const ITEM_ICON: Record<string, LucideIcon> = { rg: IdCard, cnh: Car, certidao: FileText, passaporte: Plane, tag: Bone, vacina: Syringe, torcedor: Trophy };

export function Offer({ settings }: { settings: SiteSettings }) {
  const hydrated = useHydrated();
  const s = useQuiz();
  const pet = s.pet;
  const { label: timer, left } = useCountdown(settings.timerMinutes);
  const [showBar, setShowBar] = useState(false);
  const [notice, setNotice] = useState('');
  const priceRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(
    () => buildDocContext({ pet, settings, seed: s.lead?.petId || pet.name || 'pet', slug: s.lead?.slug, phone: s.contact.phone, preview: true }),
    [pet, settings, s.lead, s.contact.phone],
  );

  const name = hasName(pet) ? petName(pet) : 'seu pet';
  const doNome = doPet(pet);
  const discount = Math.round((1 - settings.price / settings.anchorPrice) * 100);
  const team = findTeam(pet.team?.id, allTeams(settings.extraTeams));

  useEffect(() => {
    if (!hydrated) return;
    track('ViewContent', { content_name: 'Oferta Kit Identidade Pet', value: settings.price, currency: 'BRL' });
    track('VerOferta', { especie: pet.species ?? 'nao-informado' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Barra fixa aparece depois que a pessoa passa do primeiro bloco de preço.
  useEffect(() => {
    const el = priceRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [hydrated]);

  const buy = useCallback(
    (from: string, exit = false) => {
      const group = checkoutGroup(pet.species);
      // Oferta de saída: usa o checkout com o preço extra, se configurado no painel.
      const exitUrl = exit ? settings.exitOffer.checkout[group] : '';
      const base = exitUrl || settings.checkout[group];
      const value = exitUrl ? settings.exitOffer.price : settings.price;
      track('InitiateCheckout', { value, currency: 'BRL', content_name: 'Kit Identidade Pet', content_category: group, num_items: 1 });
      track('CliqueComprar', { origem: from, checkout: group }, { pixel: false });
      const firstTutor = pet.tutors?.[0]?.name?.trim();
      const url = buildCheckoutUrl({
        baseUrl: base,
        params: settings.checkoutParams,
        name: firstTutor && firstTutor.length > 1 ? firstTutor : undefined,
        email: s.contact.email,
        phone: s.contact.phone,
      });
      if (!url) {
        setNotice(`Checkout de "${group}" ainda não configurado no painel /admin.`);
        return;
      }
      window.location.href = url;
    },
    [pet.species, pet.tutors, settings, s.contact.email, s.contact.phone],
  );

  if (!hydrated) return <div className="min-h-dvh" />;

  const persona = pet.personality ? PERSONALITIES[pet.personality] : undefined;
  const SpeciesIcon = SPECIES_ICON[pet.species ?? 'outro'];
  const PersonaIcon = pet.personality ? PERSONALITY_ICON[pet.personality] : PawPrint;
  const ctaLabel = `Liberar o kit ${hasName(pet) ? doNome : 'do meu pet'}`;

  return (
    <div className="mx-auto w-full max-w-[480px] pb-28">
      <Confetti />
      <header className="flex justify-center pt-4">
        <Logo size={92} priority />
      </header>

      {/* 1. Título */}
      <section className="px-4 pt-3 text-center">
        <span className="chip !bg-[#E6F4EA] !text-verde"><Check size={14} strokeWidth={3} /> Prévia pronta</span>
        <h1 className="h-display mt-3 text-[30px] leading-[1.1]">
          O kit {hasName(pet) ? doNome : 'do seu pet'} está pronto!
        </h1>
        <p className="mt-2 font-semibold text-cacau/70">Montamos tudo com o que você contou. Olha só:</p>
      </section>

      {/* 2. Perfil */}
      <section className="px-4 pt-5">
        <div className="card anim-fade-up flex gap-4 p-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-mel bg-areia">
            {pet.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pet.photo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-roxo">
                <SpeciesIcon size={36} />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold leading-tight">
              {persona ? (
                <>
                  {hasName(pet) ? name : 'Seu pet'} é {pet.sex === 'femea' ? 'uma' : 'um'} <span className="text-roxo">{personalityLabel(pet)}</span>
                </>
              ) : (
                <>{hasName(pet) ? name : 'Seu pet'} é único</>
              )}
            </p>
            <p className="mt-1 text-[14px] font-semibold leading-snug text-cacau/75">
              {persona ? persona.about(hasName(pet) ? name : 'Seu pet', pet.sex === 'femea' ? 'ela' : 'ele') : 'E agora vai ter os documentos à altura de quem ele é na família.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pet.breed && <span className="chip !px-2 !py-0.5 !text-xs">{pet.breed}</span>}
              {pet.personality && (
                <span className="chip !px-2 !py-0.5 !text-xs">
                  <PersonaIcon size={12} /> {personalityLabel(pet)}
                </span>
              )}
              {team && <span className="chip !px-2 !py-0.5 !text-xs">{team.short}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Prévia */}
      <section className="px-4 pt-6">
        <div className="anim-pop relative overflow-hidden rounded-[18px] shadow-2xl">
          <DocImage doc="rg" page={0} ctx={ctx} scale={0.7} alt={`RG ${doNome}`} />
          {/* Mostra até a metade e esfuma o resto: está pronto, falta só liberar. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%]"
            style={{ background: 'linear-gradient(180deg, rgba(255,248,239,0) 0%, rgba(255,248,239,.55) 22%, rgba(255,248,239,.9) 48%, #FFF8EF 72%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-4 text-center">
            <span className="flex items-center gap-1.5 rounded-full bg-cacau px-3 py-1.5 text-xs font-extrabold text-white shadow-lg">
              <Lock size={13} strokeWidth={2.6} /> Pronto, falta só liberar
            </span>
            <p className="mt-1.5 text-[13px] font-bold leading-snug text-cacau/75">O documento completo, sem marca d&apos;água, chega no seu e-mail.</p>
          </div>
        </div>
        <p className="mt-3 text-center text-[13px] font-semibold leading-snug text-cacau/70">
          Esta é a prévia do <b>RG {doNome}</b>, um dos {kitItems.length} documentos do kit, todos feitos com a foto e os dados {doNome}. Mais abaixo você vê como
          ficam os outros, num exemplo.
        </p>
      </section>

      {/* 4. Preço rápido */}
      <section className="px-4 pt-6">
        <PriceBox settings={settings} discount={discount} timer={timer} left={left} ctaLabel={ctaLabel} onBuy={() => buy('preco-topo')} refEl={priceRef} />
        {notice && <p className="mt-2 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">{notice}</p>}
      </section>

      {/* 5. Prova social curta */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-3">
            {settings.proof.avatars.length
              ? settings.proof.avatars.slice(0, 5).map((a, i) => <Avatar key={i} name="Cliente" photo={a} size={40} className="border-2 border-white" />)
              : settings.proof.reviews.length
                ? settings.proof.reviews.slice(0, 5).map((r, i) => <Avatar key={i} name={r.name} photo={r.photo} size={40} className="border-2 border-white" />)
                : Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-areia text-roxo/60" title="Foto de cliente">
                      <PawPrint size={16} />
                    </span>
                  ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <Stars value={settings.rating} size={16} />
              <span className="text-sm font-extrabold">{settings.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
            </div>
            <p className="text-sm font-bold text-cacau/70">
              {settings.tutorsCount > 0 ? `+${formatInt(settings.tutorsCount)} tutores já montaram` : 'Tutores aprovam'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. Kit na vida real */}
      <Section title="O kit na vida real" subtitle="É só imprimir em casa ou na papelaria.">
        <Marquee seconds={38}>
          {proofSlots.realLife.map((label, i) => {
            const img = settings.proof.realLife[i];
            return (
              <div key={i} className="w-[240px] shrink-0">
                {img?.url ? <ProofImg src={img.url} caption={img.caption} ratio="4 / 5" /> : <Slot label={label} ratio="4 / 5" />}
              </div>
            );
          })}
        </Marquee>
      </Section>

      {/* 7. O que vem no kit */}
      <Section title={`O que vem no kit ${doNome}`} subtitle={`${kitItems.length} documentos personalizados, prontos pra imprimir.`}>
        {settings.images.kitExample ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.images.kitExample} alt="Exemplo do kit impresso" loading="lazy" className="mb-3 w-full rounded-3xl shadow-card" />
        ) : (
          <div className="mb-4">
            <ExampleDocs settings={settings} species={pet.species} />
          </div>
        )}
        <ul className="card divide-y divide-linha overflow-hidden">
          {kitItems.map((it) => {
            const Icon = ITEM_ICON[it.id] ?? FileText;
            return (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7EEF8] text-roxo">
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold leading-tight">{fill(it.title, pet)}</span>
                  <span className="block text-[13px] font-semibold leading-snug text-cacau/65">{fill(it.lines[0], pet)}</span>
                </span>
                <span className="shrink-0 text-[13px] font-bold text-cacau/40 line-through">{formatBRL(it.value)}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 8. Bônus */}
      <Section title="+ 4 bônus de presente" subtitle="Só pra quem libera o kit hoje.">
        <div className="grid grid-cols-2 gap-3">
          {bonusItems.map((b) => {
            const cover = settings.images[b.imageKey];
            return (
              <div key={b.id} className="card overflow-hidden">
                <div className="relative aspect-[387/615] bg-gradient-to-b from-[#FBF4EC] to-[#F4E8DA] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover || `/bonus/${b.id}.webp`} alt={b.title} loading="lazy" className="h-full w-full object-contain drop-shadow-lg" />
                  {b.personalized && <span className="absolute bottom-2 left-2 rounded-full bg-roxo px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow">Personalizado</span>}
                </div>
                <div className="p-3">
                  <p className="font-display text-[15px] font-semibold leading-tight">{fill(b.title, pet)}</p>
                  <p className="mt-1 text-[12px] font-semibold leading-snug text-cacau/70">{fill(b.lines[0], pet)}</p>
                  <p className="mt-1 text-[12px] font-bold">
                    <span className="text-cacau/40 line-through">{formatBRL(b.value)}</span> <span className="text-verde">grátis</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="px-4 pt-8">
        <button type="button" onClick={() => buy('apos-bonus')} className="btn-cta shine">
          {ctaLabel} <ArrowRight size={20} strokeWidth={2.6} />
        </button>
      </div>

      {/* 9. WhatsApp */}
      <Section title="O que os tutores mandam pra gente" subtitle="Mensagens reais no WhatsApp.">
        <Marquee seconds={34} reverse>
          {proofSlots.whatsapp.map((label, i) => {
            const img = settings.proof.whatsapp[i];
            return (
              <div key={i} className="w-[210px] shrink-0">
                {img?.url ? <ProofImg src={img.url} caption={img.caption} ratio="9 / 16" /> : <Slot label={label} ratio="9 / 16" />}
              </div>
            );
          })}
        </Marquee>
      </Section>

      {/* 10. Instagram */}
      <Section title="E no Instagram…">
        <div className="space-y-3">
          {proofSlots.instagram.map((label, i) => {
            const img = settings.proof.instagram[i];
            return img?.url ? <ProofImg key={i} src={img.url} caption={img.caption} ratio="auto" /> : <Slot key={i} label={label} ratio="3 / 1" />;
          })}
        </div>
      </Section>

      {/* 11. Avaliações */}
      <Section
        title="Avaliações"
        subtitle={`Nota ${settings.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} de 5${settings.tutorsCount > 0 ? ` · ${formatInt(settings.tutorsCount)} tutores` : ''}`}
      >
        <div className="space-y-3">
          {settings.proof.reviews.length
            ? settings.proof.reviews.map((r, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} photo={r.photo} size={46} />
                    <div className="min-w-0">
                      <p className="font-extrabold leading-tight">{r.name}</p>
                      <p className="text-xs font-bold text-cacau/60">
                        {r.city}
                        {r.petName ? ` · tutor(a) de ${r.petName}` : ''}
                      </p>
                    </div>
                    <Stars value={r.stars} size={14} className="ml-auto" />
                  </div>
                  <p className="mt-3 text-[15px] font-semibold leading-snug">{r.text}</p>
                </div>
              ))
            : Array.from({ length: proofSlots.reviews }, (_, i) => (
                <div key={i} className="placeholder-slot !justify-start !p-4 !text-left" style={{ minHeight: 120 }}>
                  <span>
                    Avaliação real {i + 1}
                    <br />
                    foto do pet · nome · cidade · estrelas · texto
                  </span>
                </div>
              ))}
        </div>
      </Section>

      {/* 12. Como funciona */}
      <Section title="Como funciona">
        <ol className="space-y-3">
          {(
            [
              [CreditCard, 'Pague com Pix ou cartão', 'Pagamento único, sem mensalidade.'],
              [Mail, 'Receba tudo no e-mail', `Os documentos ${doNome} chegam prontos, em PDF e imagem.`],
              [Printer, 'Imprima e use', 'Em casa ou na papelaria. Já vem no tamanho certo, com linha de corte.'],
            ] as const
          ).map(([Icon, t, d], i) => (
            <li key={t} className="card flex items-center gap-3 p-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F7EEF8] text-roxo">
                <Icon size={22} strokeWidth={2.2} />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-roxo text-[11px] font-extrabold text-white">{i + 1}</span>
              </span>
              <span>
                <span className="block font-extrabold">{t}</span>
                <span className="block text-sm font-semibold text-cacau/70">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* 13. Oferta completa */}
      <Section title="Tudo o que você recebe hoje">
        <div className="card overflow-hidden">
          <ul className="divide-y divide-linha">
            {kitItems.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[15px] font-bold">
                <span className="flex items-start gap-2"><Check size={18} strokeWidth={3} className="mt-0.5 shrink-0 text-verde" /> {fill(it.title, pet)}</span>
                <span className="shrink-0 text-cacau/40 line-through">{formatBRL(it.value)}</span>
              </li>
            ))}
            {bonusItems.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 bg-[#FFF8EA] px-4 py-3 text-[15px] font-bold">
                <span className="flex items-start gap-2"><Gift size={18} strokeWidth={2.4} className="mt-0.5 shrink-0 text-laranja" /> {fill(b.title, pet)}</span>
                <span className="shrink-0 text-cacau/40 line-through">{formatBRL(b.value)}</span>
              </li>
            ))}
          </ul>
          <div className="bg-cacau px-4 py-5 text-center text-white">
            <p className="text-sm font-bold opacity-80">
              Valor total: <span className="line-through">{formatBRL(fullTotal)}</span>
            </p>
            <p className="mt-1 text-sm font-bold">Hoje, pagamento único de</p>
            <p className="font-display text-5xl font-semibold text-mel">{formatBRL(settings.price)}</p>
            <button type="button" onClick={() => buy('oferta-completa')} className="btn-cta shine mt-4">
              {ctaLabel} <ArrowRight size={20} strokeWidth={2.6} />
            </button>
            <p className="mt-3 text-xs font-bold opacity-80">Pix ou cartão · acesso imediato · garantia de 7 dias</p>
          </div>
        </div>
      </Section>

      {/* 14. Garantia */}
      <Section title="Garantia de 7 dias">
        <div className="card flex items-center gap-4 p-4">
          <GuaranteeSeal />
          <p className="text-[15px] font-semibold leading-snug">
            Receba, imprima e use. Se não amar o kit {doNome}, é só pedir em até 7 dias que devolvemos <b>100% do valor</b>. Sem perguntas, sem burocracia.
          </p>
        </div>
      </Section>

      {/* 15. FAQ */}
      <Section title="Dúvidas frequentes">
        <Faq doNome={doNome} />
      </Section>

      {/* 16. Rodapé */}
      <footer className="px-4 pt-10 text-center">
        <button type="button" onClick={() => buy('rodape')} className="btn-cta shine">
          {ctaLabel} <ArrowRight size={20} strokeWidth={2.6} />
        </button>
        <div className="mt-8 flex justify-center">
          <Logo size={110} />
        </div>
        <nav className="mt-4 flex justify-center gap-4 text-sm font-bold text-roxo underline">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos de uso</Link>
        </nav>
        <p className="mt-3 text-sm font-semibold text-cacau/70">
          Suporte: {settings.support.email}
          {settings.support.whatsapp ? ` · WhatsApp ${settings.support.whatsapp}` : ''}
        </p>
        <p className="mx-auto mt-4 max-w-sm text-xs font-semibold leading-relaxed text-cacau/55">
          Produto digital personalizado de uso pessoal. Não tem validade oficial e não substitui documentos emitidos por médico-veterinário ou órgãos públicos.
        </p>
        <p className="mt-2 text-xs font-semibold text-cacau/40">
          © {new Date().getFullYear()} {settings.company.name}
          {settings.company.document ? ` · ${settings.company.document}` : ''}
        </p>
      </footer>

      <ExitIntent settings={settings} pet={pet} timer={timer} onBuy={buy} />

      {/* Barra fixa */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 backdrop-blur transition-transform duration-300 ${showBar ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-4 py-3">
          <div className="shrink-0 leading-tight">
            <p className="text-xs font-bold text-cacau/50 line-through">{formatBRL(settings.anchorPrice)}</p>
            <p className="font-display text-xl font-semibold text-roxo">{formatBRL(settings.price)}</p>
            {left > 0 && <p className="flex items-center gap-1 text-[11px] font-extrabold text-[#C2410C]"><Timer size={11} strokeWidth={3} /> {timer}</p>}
          </div>
          <button type="button" onClick={() => buy('barra-fixa')} className="btn-cta !min-h-[52px] !text-base">
            Liberar o kit <ArrowRight size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-10">
      <h2 className="h-display text-[24px] leading-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-[15px] font-semibold text-cacau/65">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Faixa que anda sozinha, em loop contínuo (pausa ao tocar). */
/** Faixa que anda sozinha, em loop contínuo (pausa ao tocar). Duas cópias iguais: a animação anda exatamente uma cópia. */
function Marquee({ children, seconds = 36, reverse }: { children: React.ReactNode; seconds?: number; reverse?: boolean }) {
  return (
    <div className="marquee -mx-4 overflow-hidden">
      <div className="marquee-track flex w-max" style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        <div className="flex gap-3 pl-3">{children}</div>
        <div className="flex gap-3 pl-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

function ProofImg({ src, caption, ratio }: { src: string; caption?: string; ratio: string }) {
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={caption ?? ''} loading="lazy" className="w-full rounded-2xl object-cover shadow-card" style={ratio === 'auto' ? undefined : { aspectRatio: ratio }} />
      {caption && <figcaption className="mt-1 text-center text-xs font-bold text-cacau/60">{caption}</figcaption>}
    </figure>
  );
}

function PriceBox({
  settings,
  discount,
  timer,
  left,
  ctaLabel,
  onBuy,
  refEl,
}: {
  settings: SiteSettings;
  discount: number;
  timer: string;
  left: number;
  ctaLabel: string;
  onBuy: () => void;
  refEl: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div ref={refEl} className="card relative overflow-hidden border-2 border-mel p-5 text-center">
      <span className="mb-2 inline-flex -rotate-2 items-center gap-1 rounded-lg bg-verde px-3 py-1 text-sm font-extrabold text-white shadow"><BadgePercent size={15} strokeWidth={2.6} /> -{discount}% aplicado</span>
      <p className="text-sm font-bold text-cacau/60">
        De <span className="line-through">{formatBRL(settings.anchorPrice)}</span> por apenas
      </p>
      <p className="font-display text-[52px] font-semibold leading-none text-roxo">{formatBRL(settings.price)}</p>
      <p className="mt-1 text-sm font-bold text-cacau/60">pagamento único · Pix ou cartão</p>
      <div className={`mx-auto mt-4 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${left > 0 ? 'bg-[#FFF1E0] text-[#C2410C]' : 'bg-areia text-cacau'}`}>
        {left > 0 ? (
          <>
            <Timer size={15} strokeWidth={2.6} /> Desconto reservado por <span className="font-mono tabular-nums">{timer}</span>
          </>
        ) : (
          <>Seu desconto continua reservado</>
        )}
      </div>
      <button type="button" onClick={onBuy} className="btn-cta shine anim-pulse mt-4 text-xl">
        {ctaLabel} <ArrowRight size={22} strokeWidth={2.6} />
      </button>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-extrabold leading-tight text-cacau/75">
        {(
          [
            [Zap, 'Acesso imediato'],
            [ShieldCheck, 'Garantia de 7 dias'],
            [BadgePercent, 'Desconto garantido'],
          ] as const
        ).map(([Icon, l]) => (
          <span key={l} className="flex flex-col items-center gap-1 rounded-xl bg-areia/70 p-2">
            <Icon size={18} className="text-roxo" strokeWidth={2.3} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function GuaranteeSeal() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0" aria-hidden>
      <defs>
        <path id="circ" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
      </defs>
      <polygon
        fill="#F5A524"
        points={Array.from({ length: 32 }, (_, i) => {
          const r = i % 2 ? 54 : 60;
          const a = (i * Math.PI) / 16;
          return `${60 + Math.cos(a) * r},${60 + Math.sin(a) * r}`;
        }).join(' ')}
      />
      <circle cx="60" cy="60" r="46" fill="#6F2A7A" />
      <text fontSize="9" fontWeight="800" fill="#F2C46B" letterSpacing="2">
        <textPath href="#circ">GARANTIA · SATISFAÇÃO · GARANTIA ·</textPath>
      </text>
      <text x="60" y="62" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" fontFamily="var(--font-display)">
        7
      </text>
      <text x="60" y="78" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
        DIAS
      </text>
    </svg>
  );
}

function Faq({ doNome }: { doNome: string }) {
  const items: [string, React.ReactNode][] = [
    [
      'Como eu recebo o kit?',
      `Assim que o pagamento é aprovado (Pix cai na hora, cartão em segundos), você confere os dados ${doNome} e recebe todos os documentos no seu e-mail: PDF pronto pra imprimir e todas as imagens.`,
    ],
    [
      'Dá pra imprimir em casa?',
      'Sim! Funciona em impressora comum. Para o RG e a carteirinha ficarem com cara de cartão, use papel fotográfico ou couchê (180 g ou mais) e plastifique. Se preferir, qualquer papelaria imprime e plastifica por poucos reais. O PDF já vem no tamanho certo, com linha de corte.',
    ],
    [
      'Errei um dado. Consigo corrigir?',
      'Logo depois do pagamento, antes de gerar os arquivos, você confere tudo com calma e corrige o que precisar. Se mesmo assim algo sair errado, fale com o nosso suporte.',
    ],
    [
      'Tenho mais de um pet. Como faço?',
      'No pagamento você pode incluir mais 1 pet no kit, com todos os documentos e bônus dele também.',
    ],
    [
      'Como funciona a tag com QR Code?',
      'A tag vem em formato de ossinho: de um lado o nome, do outro o QR Code. É só recortar, plastificar e pendurar na coleira. Quem encontrar seu pet aponta a câmera do celular e vê a identidade completa dele, com foto, dados e o contato dos tutores. Não precisa de aplicativo.',
    ],
    [
      'Os documentos têm validade oficial?',
      'Não. São documentos personalizados, de uso pessoal e afetivo, pra organizar a vida do seu pet e guardar de lembrança. Existe um cadastro oficial e gratuito do governo federal, o RG Animal do SinPatinhas; se você já tiver esse número, pode anotar no campo próprio do nosso RG. A carteira de vacinação serve para organização e não substitui a assinada pelo veterinário, e o passaporte é de lembrança, não é documento de viagem.',
    ],
    ['E se eu não gostar?', 'Você tem 7 dias de garantia. Se não amar o kit, é só pedir pelo suporte que devolvemos 100% do valor.'],
    ['O pagamento é seguro?', 'Sim. O pagamento é processado por uma plataforma de pagamentos segura, com Pix ou cartão. Nós não vemos nem guardamos os dados do seu cartão.'],
  ];
  return (
    <div className="space-y-2">
      {items.map(([q, a]) => (
        <details key={q} className="group card overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-extrabold">
            {q}
            <span className="shrink-0 text-roxo transition-transform group-open:rotate-45">＋</span>
          </summary>
          <div className="px-4 pb-4 text-[15px] font-semibold leading-relaxed text-cacau/80">{a}</div>
        </details>
      ))}
    </div>
  );
}

function Confetti() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 3500);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  const colors = ['#E9A092', '#F5A524', '#6F2A7A', '#A9BAA6', '#E8833A'];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animation: `confetti-fall ${2.2 + (i % 5) * 0.3}s ${(i % 7) * 0.08}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
