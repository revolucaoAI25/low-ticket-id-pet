'use client';

import { ArrowLeft, ArrowRight, Baby, Check, Clock, Eye, House, Mail, MapPin, Plus, Printer, ShieldCheck, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SiteSettings } from '@/config/site';
import { IconBubble, PERSONALITY_ICON, SPECIES_ICON } from '@/components/icons';
import { Logo, Stars, formatInt } from '@/components/ui';
import { PERSONALITIES, doPet, g, hasName, oPet, petName, type Origin, type Personality, type Sex, type TeamChoice, type Tutor } from '@/lib/pet';
import { useHydrated, useQuiz, quizStore } from '@/lib/quiz-store';
import { SPECIES, getSpecies, type Species } from '@/lib/species';
import { allTeams } from '@/lib/teams';
import { getMetaIds, setPixelUserData, track, getUtms, sessionId } from '@/lib/tracking';
import { BreedPicker } from './BreedPicker';
import { PhotoPicker } from './PhotoPicker';
import { TeamPicker } from './TeamPicker';
import { Loading } from './Loading';

const STEPS = [
  'abertura',
  'especie',
  'nome',
  'sexo',
  'raca',
  'personalidade',
  'origem',
  'time',
  'tutores',
  'cidade',
  'endereco',
  'foto',
  'contato',
  'carregando',
] as const;
const LAST_QUESTION = STEPS.indexOf('contato');
const SRD = 'SRD (vira-lata)';

export function Quiz({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const s = useQuiz();
  const step = s.step;
  const pet = s.pet;
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const firstStep = useRef<number | null>(null);
  const moved = useRef(false);
  const teams = useMemo(() => allTeams(settings.extraTeams), [settings.extraTeams]);
  const leadPromise = useRef<Promise<unknown> | null>(null);

  // ---------- navegação (com botão voltar do celular) ----------
  const go = useCallback((n: number, opts: { replace?: boolean } = {}) => {
    const cur = quizStore.get().step;
    moved.current = true;
    setDir(n >= cur ? 'fwd' : 'back');
    quizStore.set((st) => ({ step: n, maxStep: Math.max(st.maxStep, n) }));
    try {
      if (opts.replace) history.replaceState({ quizStep: n }, '');
      else history.pushState({ quizStep: n }, '');
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const st = quizStore.get();
    if (st.step > LAST_QUESTION) {
      router.replace('/resultado');
      return;
    }
    try {
      history.replaceState({ quizStep: st.step }, '');
    } catch {
      /* ignore */
    }
    const onPop = (e: PopStateEvent) => {
      const n = typeof e.state?.quizStep === 'number' ? e.state.quizStep : 0;
      moved.current = true;
      setDir('back');
      quizStore.set({ step: n });
    };
    window.addEventListener('popstate', onPop);
    router.prefetch('/resultado');
    return () => window.removeEventListener('popstate', onPop);
  }, [router]);

  const next = useCallback(() => go(quizStore.get().step + 1), [go]);
  const back = useCallback(() => {
    if (history.state?.quizStep > 0) history.back();
    else go(Math.max(0, quizStore.get().step - 1), { replace: true });
  }, [go]);

  // ---------- eventos por tela ----------
  useEffect(() => {
    if (!hydrated) return;
    if (step === 0) track('ViewContent', { content_name: 'Abertura do quiz' }, { step });
    track('QuizEtapa', { etapa: step, tela: STEPS[step] }, { step });
  }, [step, hydrated]);

  const pick = useCallback(
    (patch: Parameters<typeof quizStore.setPet>[0]) => {
      quizStore.setPet(patch);
      setTimeout(next, 260);
    },
    [next],
  );

  // ---------- salvar lead ----------
  const saveLead = useCallback(() => {
    const st = quizStore.get();
    const { phone, email, consent } = st.contact;
    if (!consent || (!phone.trim() && !email.trim())) return;
    setPixelUserData(settings.tracking.metaPixelId, email, phone);
    track('Lead', { content_name: 'Contato do quiz' }, { step: LAST_QUESTION });
    leadPromise.current = fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pet: st.pet, contact: st.contact, utms: getUtms(), meta: getMetaIds(), sessionId: sessionId(), lead: st.lead }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.token) {
          quizStore.set({ lead: { token: data.token, petId: data.petId, slug: data.slug } });
          if (data.photoUrl) quizStore.setPet({ photo: data.photoUrl });
        }
      })
      .catch(() => undefined);
  }, [settings.tracking.metaPixelId]);

  const finishLoading = useCallback(async () => {
    if (leadPromise.current) await Promise.race([leadPromise.current, new Promise((r) => setTimeout(r, 4000))]);
    quizStore.set((st) => ({ step: LAST_QUESTION + 1, timerEnd: st.timerEnd && st.timerEnd > Date.now() ? st.timerEnd : Date.now() + settings.timerMinutes * 60_000 }));
    router.push('/resultado');
  }, [router, settings.timerMinutes]);

  // Antes de ler o progresso salvo, a abertura já vem pronta do servidor: aparece na hora,
  // sem esperar o JavaScript (quem chega pelo anúncio não vê tela em branco).
  if (!hydrated) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
        <main className="flex flex-1 flex-col px-4 pb-8">
          <Opening settings={settings} onStart={() => undefined} />
        </main>
      </div>
    );
  }

  const species = getSpecies(pet.species);
  const isQuestion = step >= 1 && step <= LAST_QUESTION;
  const progress = Math.min(1, step / LAST_QUESTION);
  // A tela que já estava aberta ao carregar não anima de novo (evita a abertura "piscar").
  if (firstStep.current === null) firstStep.current = step;
  const anim = step === firstStep.current && !moved.current ? '' : dir === 'fwd' ? 'anim-screen' : 'anim-screen-back';
  const name = hasName(pet) ? petName(pet) : '';
  const id = STEPS[step];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      {isQuestion && (
        <header className="sticky top-0 z-30 bg-creme/90 px-4 pb-3 pt-3 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <button type="button" onClick={back} aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-cacau shadow-card active:scale-95">
              <ArrowLeft size={20} strokeWidth={2.4} />
            </button>
            <Logo size={58} />
            <button type="button" onClick={next} className="h-10 rounded-full px-3 text-sm font-bold text-cacau/55 active:bg-areia">
              Pular
            </button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-linha/80" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-coral to-roxo transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        </header>
      )}

      <main key={step} className={`flex flex-1 flex-col px-4 pb-8 ${anim}`}>
        {id === 'abertura' && <Opening settings={settings} onStart={next} />}

        {id === 'especie' && (
          <Screen title="Quem é o seu melhor amigo?" subtitle="Vamos montar o kit com a cara dele.">
            <div className="grid grid-cols-2 gap-3">
              {SPECIES.map((sp) => (
                <Option key={sp.id} selected={pet.species === sp.id} onClick={() => pick({ species: sp.id as Species })} vertical>
                  <IconBubble icon={SPECIES_ICON[sp.id]} selected={pet.species === sp.id} size="lg" />
                  {sp.label}
                </Option>
              ))}
            </div>
          </Screen>
        )}

        {id === 'nome' && (
          <Screen title={`Qual é o nome do seu ${species?.noun ?? 'pet'}?`} subtitle="Vai aparecer em todos os documentos.">
            <input
              className="input text-center font-display !text-2xl"
              autoFocus
              placeholder="Ex.: Paçoca"
              value={pet.name ?? ''}
              maxLength={24}
              onChange={(e) => quizStore.setPet({ name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              autoCapitalize="words"
              enterKeyHint="next"
              autoComplete="off"
            />
            <Continue onClick={next} />
          </Screen>
        )}

        {id === 'sexo' && (
          <Screen title={name ? `${name} é macho ou fêmea?` : 'É macho ou fêmea?'}>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['macho', 'Macho', '♂', '#3D7DC8'],
                  ['femea', 'Fêmea', '♀', '#E06C98'],
                ] as [Sex, string, string, string][]
              ).map(([sx, label, sym, color]) => (
                <Option key={sx} selected={pet.sex === sx} onClick={() => pick({ sex: sx })} vertical>
                  <span className="flex h-16 w-16 items-center justify-center rounded-full text-4xl font-bold" style={{ background: `${color}1A`, color }}>
                    {sym}
                  </span>
                  {label}
                </Option>
              ))}
            </div>
            <button type="button" onClick={() => pick({ sex: 'nao-sei' })} className="mt-4 text-center text-sm font-bold text-cacau/50">
              Não sei / prefiro não dizer
            </button>
          </Screen>
        )}

        {id === 'raca' && (
          <Screen title={name ? `Qual é a raça ${doPet(pet)}?` : 'Qual é a raça?'} subtitle="Vai no RG e na certidão.">
            <Label>Digite ou escolha a raça</Label>
            <BreedPicker breeds={(species?.breeds ?? SPECIES[0].breeds).filter((b) => b !== SRD)} value={pet.breed === SRD ? '' : pet.breed ?? ''} onChange={(v) => quizStore.setPet({ breed: v })} />
            <div className="my-5 flex items-center gap-3 text-xs font-extrabold uppercase tracking-wider text-cacau/40">
              <span className="h-px flex-1 bg-linha" /> não tem raça definida? <span className="h-px flex-1 bg-linha" />
            </div>
            <Option selected={pet.breed === SRD} onClick={() => pick({ breed: SRD })}>
              <IconBubble icon={SPECIES_ICON[pet.species ?? 'outro']} selected={pet.breed === SRD} size="sm" />
              <span className="flex flex-col">
                <span>Sem raça definida (vira-lata)</span>
                <span className="text-sm font-semibold text-cacau/60">Com muito orgulho</span>
              </span>
            </Option>
            <Continue onClick={next} />
          </Screen>
        )}

        {id === 'personalidade' && (
          <Screen title={`Como é a personalidade ${doPet(pet)}?`} subtitle="Escolha a que mais combina.">
            <div className="space-y-3">
              {(Object.keys(PERSONALITIES) as Personality[]).map((pid) => {
                const d = PERSONALITIES[pid];
                return (
                  <Option key={pid} selected={pet.personality === pid} onClick={() => pick({ personality: pid })}>
                    <IconBubble icon={PERSONALITY_ICON[pid]} selected={pet.personality === pid} />
                    <span className="flex flex-col">
                      <span className="text-lg">{g(pet, d.m, d.f)}</span>
                      <span className="text-sm font-semibold text-cacau/60">{d.hint}</span>
                    </span>
                  </Option>
                );
              })}
            </div>
          </Screen>
        )}

        {id === 'origem' && <OriginStep onNext={next} />}

        {id === 'time' && (
          <Screen title={`${name || 'Seu pet'} torce pra qual time?`} subtitle="Pra carteirinha de torcedor.">
            <TeamPicker
              teams={teams}
              value={pet.team}
              onPick={(t: TeamChoice, unknown) => {
                if (unknown) track('TimeNaoEncontrado', { time: t.name }, { step, pixel: false });
                pick({ team: t });
              }}
            />
          </Screen>
        )}

        {id === 'tutores' && <TutorsStep onNext={next} />}

        {id === 'cidade' && (
          <Screen title={`Em que cidade ${oPet(pet)} mora?`} subtitle="Vai na certidão e no RG.">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cacau/40" size={22} />
              <input
                className="input !pl-12"
                autoFocus
                placeholder="Ex.: Belo Horizonte - MG"
                value={pet.address?.city ?? ''}
                onChange={(e) => quizStore.setPet({ address: { ...quizStore.get().pet.address, city: e.target.value } })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                autoCapitalize="words"
                autoComplete="address-level2"
                enterKeyHint="next"
              />
            </div>
            <Continue onClick={next} />
          </Screen>
        )}

        {id === 'endereco' && (
          <Screen title={`Qual é o endereço ${doPet(pet)}?`} subtitle="Aparece na identidade que abre pelo QR Code da tag, pra quem encontrar saber onde ele mora.">
            <Label>Rua e número</Label>
            <input
              className="input"
              placeholder="Ex.: Rua das Flores, 120"
              value={pet.address?.street ?? ''}
              onChange={(e) => quizStore.setPet({ address: { ...quizStore.get().pet.address, street: e.target.value } })}
              autoComplete="address-line1"
              enterKeyHint="next"
            />
            <Label className="mt-5">Bairro</Label>
            <input
              className="input"
              placeholder="Ex.: Santa Tereza"
              value={pet.address?.district ?? ''}
              onChange={(e) => quizStore.setPet({ address: { ...quizStore.get().pet.address, district: e.target.value } })}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              autoComplete="address-line2"
              enterKeyHint="done"
            />
            <Continue onClick={next} />
          </Screen>
        )}

        {id === 'foto' && <PhotoStep onNext={next} />}

        {id === 'contato' && <ContactStep onSubmit={() => (saveLead(), go(LAST_QUESTION + 1))} title={`Pra onde enviamos o kit ${doPet(pet)}?`} />}

        {id === 'carregando' && <Loading pet={pet} settings={settings} onDone={finishLoading} />}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-1 flex-col pt-4">
      <h1 className="h-display text-[28px] leading-[1.12]">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] font-semibold leading-snug text-cacau/65">{subtitle}</p>}
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function Option({ selected, onClick, children, vertical }: { selected?: boolean; onClick: () => void; children: React.ReactNode; vertical?: boolean }) {
  return (
    <button type="button" data-selected={!!selected} onClick={onClick} className={`option ${vertical ? '!flex-col !gap-2 !py-5 text-center text-lg' : ''}`}>
      {children}
      {selected && (
        <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-roxo text-white">
          <Check size={13} strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-2 text-xs font-extrabold uppercase tracking-wider text-cacau/55 ${className}`}>{children}</p>;
}

function Continue({ onClick, label = 'Continuar' }: { onClick: () => void; label?: string }) {
  return (
    // Fixo no rodapé: em celular pequeno o botão fica sempre à vista, sem precisar rolar.
    <div className="pointer-events-none sticky bottom-0 z-10 -mx-4 mt-auto bg-gradient-to-t from-creme from-70% to-creme/0 px-4 pb-4 pt-8">
      <button type="button" onClick={onClick} className="btn-primary pointer-events-auto w-full">
        {label} <ArrowRight size={20} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function Opening({ settings, onStart }: { settings: SiteSettings; onStart: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center pt-2 text-center">
      <Logo size={96} priority />
      <h1 className="h-display mt-3 text-[36px] leading-[1.02]">
        <span className="text-roxo">Kit Identidade Pet</span>
      </h1>
      <p className="mt-2 font-display text-[21px] font-semibold leading-tight text-cacau">O RG do seu pet, com foto e nome</p>
      <p className="mt-2 text-[15px] font-semibold leading-snug text-cacau/70">
        E mais: CNH Pet, certidão, passaporte, carteira de vacinação, carteirinha de torcedor e tag com QR Code. Tudo personalizado e pronto pra imprimir.
      </p>
      <div className="mt-4 w-full">
        {settings.images.heroMockup ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.images.heroMockup} alt="Kit Identidade Pet" className="mx-auto h-[29svh] w-auto max-w-full object-contain" fetchPriority="high" />
        ) : (
          // Mockup estático (leve e instantâneo). Para trocar, suba uma imagem em /admin → Imagens.
          <Image src="/brand/kit-mockup-v6.webp" alt="RG, CNH, certidão, carteira de vacinação, carteirinha de torcedor e tag com QR Code do Kit Identidade Pet" width={900} height={684} priority quality={65} sizes="(max-width: 480px) 92vw, 420px" className="mx-auto h-[29svh] w-auto max-w-full object-contain" />
        )}
      </div>
      <div className="mt-5 w-full">
        <button type="button" onClick={onStart} className="btn-cta shine anim-pulse whitespace-nowrap text-[18px] min-[380px]:text-xl">
          Montar o kit do meu pet <ArrowRight size={22} strokeWidth={2.6} />
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-cacau/65">
          <Clock size={15} strokeWidth={2.5} /> Leva 2 minutos · prévia grátis
        </p>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <Stars value={settings.rating} />
        <span className="font-extrabold">{settings.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
        {settings.tutorsCount > 0 && <span className="text-sm font-bold text-cacau/60">· +{formatInt(settings.tutorsCount)} tutores</span>}
      </div>
      <ul className="mt-6 grid w-full grid-cols-3 gap-2 text-[12px] font-bold leading-tight text-cacau/75">
        {[
          [Eye, 'Veja antes de pagar'],
          [Mail, 'Receba no e-mail'],
          [Printer, 'Imprima em casa'],
        ].map(([Icon, label]) => {
          const I = Icon as typeof Eye;
          return (
            <li key={label as string} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 shadow-card">
              <I size={20} className="text-roxo" strokeWidth={2.2} />
              {label as string}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function OriginStep({ onNext }: { onNext: () => void }) {
  const { pet } = useQuiz();
  const today = new Date().toISOString().slice(0, 10);
  const opts: [Origin, string, typeof Baby][] = [
    ['nascimento', 'Nasceu com a gente', Baby],
    ['adocao', g(pet, 'Foi adotado', 'Foi adotada'), House],
  ];
  return (
    <Screen title={`Como ${oPet(pet)} chegou na sua vida?`} subtitle="Define se vem a certidão de nascimento ou de adoção.">
      <div className="grid grid-cols-2 gap-3">
        {opts.map(([oid, label, Icon]) => (
          <Option key={oid} selected={pet.origin === oid} onClick={() => quizStore.setPet({ origin: oid })} vertical>
            <IconBubble icon={Icon} selected={pet.origin === oid} size="lg" />
            {label}
          </Option>
        ))}
      </div>
      {pet.origin && (
        <div className="anim-fade-up mt-6">
          <Label>{pet.origin === 'adocao' ? 'Data da adoção' : 'Data de nascimento'} (se souber)</Label>
          <input type="date" className="input" max={today} value={pet.date ?? ''} onChange={(e) => quizStore.setPet({ date: e.target.value })} />
        </div>
      )}
      <Continue onClick={onNext} />
    </Screen>
  );
}

function TutorsStep({ onNext }: { onNext: () => void }) {
  const { pet } = useQuiz();
  const list: Tutor[] = pet.tutors?.length ? pet.tutors : [{ name: '' }];
  const set = (t: Tutor[]) => quizStore.setPet({ tutors: t });
  return (
    <Screen title={`Quem são os tutores ${doPet(pet)}?`} subtitle="Vão no RG, na CNH e na certidão.">
      <div className="space-y-3">
        {list.map((t, i) => (
          <div key={i} className="anim-fade-up relative">
            <input
              className="input pr-12"
              autoFocus={i === list.length - 1 && i > 0}
              placeholder={i === 0 ? 'Seu nome' : `Nome do tutor ${i + 1}`}
              value={t.name}
              onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              autoCapitalize="words"
              autoComplete={i === 0 ? 'name' : 'off'}
              enterKeyHint="next"
            />
            {list.length > 1 && (
              <button
                type="button"
                aria-label="Remover tutor"
                onClick={() => set(list.filter((_, j) => j !== i))}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-cacau/40 active:bg-areia"
              >
                <X size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
      {list.length < 4 && (
        <button
          type="button"
          onClick={() => set([...list, { name: '' }])}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-linha py-3 font-bold text-roxo active:bg-white"
        >
          <Plus size={18} strokeWidth={2.6} /> Adicionar mais um tutor
        </button>
      )}
      <Continue onClick={onNext} />
    </Screen>
  );
}

function PhotoStep({ onNext }: { onNext: () => void }) {
  const { pet } = useQuiz();
  return (
    <Screen title={`Agora a parte mais fofa: uma foto ${doPet(pet)}`} subtitle="De frente, com boa luz. Ela vai no RG, na CNH, na certidão e nos bônus.">
      <PhotoPicker value={pet.photo} species={pet.species} onChange={(photo) => quizStore.setPet({ photo })} />
      {pet.photo && <p className="anim-fade-up mt-4 text-center text-sm font-bold text-verde">Ficou ótima!</p>}
      <Continue onClick={onNext} label={pet.photo ? 'Continuar' : 'Continuar sem foto'} />
    </Screen>
  );
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function ContactStep({ onSubmit, title }: { onSubmit: () => void; title: string }) {
  const { contact } = useQuiz();
  const [nudge, setNudge] = useState(false);
  const filled = contact.phone.replace(/\D/g, '').length >= 10 || /\S+@\S+\.\S+/.test(contact.email);
  const setContact = (p: Partial<typeof contact>) => quizStore.set((st) => ({ contact: { ...st.contact, ...p } }));

  function submit() {
    if (filled && !contact.consent) {
      setNudge(true);
      return;
    }
    onSubmit();
  }

  return (
    <Screen title={title} subtitle="O kit chega completo no seu e-mail, pronto pra imprimir.">
      <Label>WhatsApp</Label>
      <input
        className="input"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(11) 91234-5678"
        value={contact.phone}
        onChange={(e) => setContact({ phone: maskPhone(e.target.value) })}
      />
      <Label className="mt-5">E-mail</Label>
      <input
        className="input"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        placeholder="voce@email.com"
        value={contact.email}
        onChange={(e) => setContact({ email: e.target.value.trim() })}
      />
      <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-2xl p-3 text-[14px] font-semibold leading-snug ${nudge && !contact.consent ? 'anim-wiggle bg-[#FFF1E0] ring-2 ring-mel' : ''}`}>
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#6F2A7A]"
          checked={contact.consent}
          onChange={(e) => {
            setContact({ consent: e.target.checked });
            setNudge(false);
          }}
        />
        <span>
          Li e aceito a{' '}
          <a href="/privacidade" target="_blank" className="font-bold text-roxo underline">
            Política de Privacidade
          </a>
          . Vamos usar seus dados só para enviar o kit e falar sobre ele.
        </span>
      </label>
      {nudge && !contact.consent && <p className="mt-1 px-3 text-sm font-bold text-[#B45309]">Marque a caixinha pra gente poder guardar o kit no seu nome.</p>}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-cacau/55">
        <ShieldCheck size={16} /> Seus dados ficam protegidos. Nada de spam.
      </p>
      <Continue onClick={submit} label="Ver o kit pronto" />
    </Screen>
  );
}
