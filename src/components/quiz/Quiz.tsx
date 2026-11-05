'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rgColors, type RgColor } from '@/config/brand';
import type { SiteSettings } from '@/config/site';
import { DocImage } from '@/components/DocImage';
import { KitFan } from '@/components/KitFan';
import { Logo, Stars, formatInt } from '@/components/ui';
import { buildDocContext } from '@/lib/doc-context';
import {
  PERSONALITIES,
  PLACES,
  defaultRgColor,
  doPet,
  g,
  hasName,
  oPet,
  petName,
  type Origin,
  type Personality,
  type Place,
  type Sex,
  type TeamChoice,
} from '@/lib/pet';
import { useHydrated, useQuiz, quizStore } from '@/lib/quiz-store';
import { SPECIES, getSpecies, type Species } from '@/lib/species';
import { allTeams } from '@/lib/teams';
import { setPixelUserData, track, getUtms, sessionId } from '@/lib/tracking';
import { BreedPicker } from './BreedPicker';
import { PhotoPicker } from './PhotoPicker';
import { TeamPicker } from './TeamPicker';
import { Loading } from './Loading';

const STEPS = ['abertura', 'especie', 'nome', 'raca-sexo', 'personalidade', 'origem', 'lugar', 'time', 'tutores', 'foto', 'cor', 'contato', 'carregando'] as const;
const LAST_QUESTION = 11;

export function Quiz({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const s = useQuiz();
  const step = s.step;
  const pet = s.pet;
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const teams = useMemo(() => allTeams(settings.extraTeams), [settings.extraTeams]);
  const leadPromise = useRef<Promise<unknown> | null>(null);

  // ---------- navegação (com botão voltar do celular) ----------
  const go = useCallback((n: number, opts: { replace?: boolean } = {}) => {
    const cur = quizStore.get().step;
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
    // Quem já chegou no fim volta direto para o resultado.
    if (st.step >= LAST_QUESTION + 1) {
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
    const name = STEPS[step];
    if (step === 0) track('ViewContent', { content_name: 'Abertura do quiz' }, { step });
    track('QuizEtapa', { etapa: step, tela: name }, { step });
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
      body: JSON.stringify({ pet: st.pet, contact: st.contact, utms: getUtms(), sessionId: sessionId(), lead: st.lead }),
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

  if (!hydrated) return <div className="min-h-dvh" />;

  const species = getSpecies(pet.species);
  const isQuestion = step >= 1 && step <= LAST_QUESTION;
  const progress = Math.min(1, step / LAST_QUESTION);
  const anim = dir === 'fwd' ? 'anim-screen' : 'anim-screen-back';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      {isQuestion && (
        <header className="sticky top-0 z-30 bg-creme/95 px-4 pb-3 pt-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <button type="button" onClick={back} aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-card active:scale-95">
              ←
            </button>
            <Logo size={64} />
            <button type="button" onClick={step === LAST_QUESTION ? () => go(LAST_QUESTION + 1) : next} className="h-10 rounded-full px-3 text-sm font-bold text-cacau/60 active:bg-areia">
              Pular
            </button>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-coral to-roxo transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        </header>
      )}

      <main key={step} className={`flex flex-1 flex-col px-4 pb-8 ${anim}`}>
        {step === 0 && <Opening settings={settings} onStart={next} />}

        {step === 1 && (
          <Screen title="Quem é o seu melhor amigo?" subtitle="Vamos montar o kit com a cara dele.">
            <div className="grid grid-cols-2 gap-3">
              {SPECIES.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  data-selected={pet.species === sp.id}
                  onClick={() => pick({ species: sp.id as Species })}
                  className="option !flex-col !gap-2 !py-5 text-center text-lg"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-areia text-4xl">{sp.emoji}</span>
                  {sp.label}
                </button>
              ))}
            </div>
          </Screen>
        )}

        {step === 2 && (
          <Screen title={`Qual é o nome do seu ${species?.noun ?? 'pet'}?`} subtitle="Vai aparecer em todos os documentos.">
            <TextStep
              value={pet.name ?? ''}
              placeholder="Ex.: Paçoca"
              onChange={(v) => quizStore.setPet({ name: v })}
              onSubmit={next}
              autoCapitalize="words"
            />
            {hasName(pet) && (
              <p className="anim-fade-up mt-4 rounded-2xl bg-white p-4 text-center font-bold shadow-card">
                No RG vai ficar: <span className="font-display text-xl text-roxo">{petName(pet)}</span> {species?.emoji}
              </p>
            )}
            <Continue onClick={next} />
          </Screen>
        )}

        {step === 3 && (
          <Screen title={`Me conta mais ${hasName(pet) ? `sobre ${oPet(pet)}` : 'sobre ele'}`} subtitle="Raça e sexo vão pro RG.">
            <Label>Sexo</Label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['macho', 'Macho', '♂'],
                  ['femea', 'Fêmea', '♀'],
                ] as [Sex, string, string][]
              ).map(([id, label, icon]) => (
                <button key={id} type="button" data-selected={pet.sex === id} onClick={() => quizStore.setPet({ sex: id })} className="option justify-center text-lg">
                  <span className={id === 'macho' ? 'text-[#3D7DC8]' : 'text-[#E06C98]'}>{icon}</span> {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => quizStore.setPet({ sex: 'nao-sei' })} className={`mt-2 text-sm font-bold ${pet.sex === 'nao-sei' ? 'text-roxo' : 'text-cacau/50'}`}>
              {pet.sex === 'nao-sei' ? '✓ ' : ''}Não sei / prefiro não dizer
            </button>
            <Label className="mt-6">Raça</Label>
            <BreedPicker breeds={species?.breeds ?? SPECIES[0].breeds} value={pet.breed ?? ''} onChange={(v) => quizStore.setPet({ breed: v })} />
            <Continue onClick={next} />
          </Screen>
        )}

        {step === 4 && (
          <Screen title={`Como é a personalidade ${doPet(pet)}?`} subtitle="Escolha a que mais combina.">
            <div className="space-y-3">
              {(Object.keys(PERSONALITIES) as Personality[]).map((id) => {
                const d = PERSONALITIES[id];
                return (
                  <button key={id} type="button" data-selected={pet.personality === id} onClick={() => pick({ personality: id })} className="option">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-areia text-2xl">{d.emoji}</span>
                    <span className="flex flex-col">
                      <span className="text-lg">{g(pet, d.m, d.f)}</span>
                      <span className="text-sm font-semibold text-cacau/60">{d.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Screen>
        )}

        {step === 5 && <OriginStep onNext={next} />}

        {step === 6 && (
          <Screen title={`Qual é o lugar favorito ${doPet(pet)}?`} subtitle="Vai virar o primeiro carimbo do Passaporte de Aventuras ✈️">
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PLACES) as Place[]).map((id) => (
                <button key={id} type="button" data-selected={pet.place === id} onClick={() => pick({ place: id })} className="option !flex-col !gap-2 !py-5 text-center">
                  <span className="text-4xl">{PLACES[id].emoji}</span>
                  {PLACES[id].label}
                </button>
              ))}
            </div>
          </Screen>
        )}

        {step === 7 && (
          <Screen title={`${hasName(pet) ? petName(pet) : 'Seu pet'} torce pra qual time?`} subtitle="Pra carteirinha de torcedor ⚽">
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

        {step === 8 && (
          <Screen title={`Quem são os tutores ${doPet(pet)}?`} subtitle="Vão no RG e na certidão.">
            <Label>Nome dos tutores</Label>
            <input
              className="input"
              placeholder="Ex.: Ana e Léo"
              value={pet.tutors ?? ''}
              onChange={(e) => quizStore.setPet({ tutors: e.target.value })}
              autoCapitalize="words"
              enterKeyHint="next"
            />
            <Label className="mt-5">Cidade</Label>
            <input
              className="input"
              placeholder="Ex.: Belo Horizonte - MG"
              value={pet.city ?? ''}
              onChange={(e) => quizStore.setPet({ city: e.target.value })}
              autoCapitalize="words"
              enterKeyHint="done"
              onKeyDown={(e) => e.key === 'Enter' && next()}
            />
            <Continue onClick={next} />
          </Screen>
        )}

        {step === 9 && (
          <Screen title={`Agora a parte mais fofa: uma foto ${doPet(pet)} 📸`} subtitle="Ela vai no RG, na certidão, na carteira de vacinação e nos bônus.">
            <PhotoPicker value={pet.photo} emoji={species?.emoji ?? '🐾'} onChange={(photo) => quizStore.setPet({ photo })} />
            <Continue onClick={next} label={pet.photo ? 'Ficou ótima! Continuar' : 'Continuar'} />
            {!pet.photo && (
              <button type="button" onClick={next} className="mt-3 text-center text-sm font-bold text-cacau/50">
                Pular, coloco a foto depois
              </button>
            )}
          </Screen>
        )}

        {step === 10 && <ColorStep settings={settings} onNext={next} />}

        {step === 11 && <ContactStep onSubmit={() => (saveLead(), go(LAST_QUESTION + 1))} title={`Pra onde enviamos o kit ${doPet(pet)}?`} />}

        {step === 12 && <Loading pet={pet} settings={settings} onDone={finishLoading} />}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-1 flex-col pt-3">
      <h1 className="h-display text-[27px] leading-[1.15]">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] font-semibold text-cacau/70">{subtitle}</p>}
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`mb-2 text-sm font-extrabold uppercase tracking-wide text-cacau/60 ${className}`}>{children}</p>;
}

function Continue({ onClick, label = 'Continuar', disabled }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <div className="mt-auto pt-8">
      <button type="button" onClick={onClick} disabled={disabled} className="btn-primary w-full">
        {label} →
      </button>
    </div>
  );
}

function TextStep(props: { value: string; placeholder: string; onChange: (v: string) => void; onSubmit: () => void; autoCapitalize?: string }) {
  return (
    <input
      className="input text-center font-display !text-2xl"
      autoFocus
      placeholder={props.placeholder}
      value={props.value}
      maxLength={24}
      onChange={(e) => props.onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && props.onSubmit()}
      autoCapitalize={props.autoCapitalize}
      enterKeyHint="next"
      autoComplete="off"
    />
  );
}

function Opening({ settings, onStart }: { settings: SiteSettings; onStart: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center pt-4 text-center">
      <Logo size={150} priority />
      <span className="chip mt-3 !bg-[#F7EEF8] !text-roxo">🐾 Kit Identidade Pet</span>
      <h1 className="h-display mt-3 text-[32px] leading-[1.08]">
        Crie o <span className="text-roxo">RG do seu pet</span> com foto e nome
      </h1>
      <p className="mt-3 text-[16px] font-semibold leading-snug text-cacau/75">
        E mais 5 documentos personalizados: certidão, passaporte de aventuras, tag com QR Code, carteira de vacinação e carteirinha de torcedor.
      </p>
      <div className="mt-5 w-full">
        {settings.images.heroMockup ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.images.heroMockup} alt="Kit Identidade Pet" className="mx-auto w-full max-w-[380px]" />
        ) : (
          <KitFan settings={settings} />
        )}
      </div>
      <div className="mt-7 w-full">
        <button type="button" onClick={onStart} className="btn-cta shine anim-pulse text-xl">
          Montar o kit do meu pet →
        </button>
        <p className="mt-3 text-sm font-bold text-cacau/70">⏱️ Leva 2 minutos · prévia grátis</p>
      </div>
      <div className="mt-5 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Stars value={settings.rating} />
          <span className="font-extrabold">{settings.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
        </div>
        {settings.tutorsCount > 0 && <p className="text-sm font-bold text-cacau/70">+{formatInt(settings.tutorsCount)} tutores já montaram o kit</p>}
      </div>
      <ul className="mt-6 grid w-full grid-cols-3 gap-2 text-[12px] font-bold text-cacau/75">
        <li className="rounded-2xl bg-white p-3 shadow-card">
          <span className="block text-xl">👀</span>Veja antes de pagar
        </li>
        <li className="rounded-2xl bg-white p-3 shadow-card">
          <span className="block text-xl">⚡</span>Download na hora
        </li>
        <li className="rounded-2xl bg-white p-3 shadow-card">
          <span className="block text-xl">🖨️</span>Imprima em casa
        </li>
      </ul>
    </section>
  );
}

function OriginStep({ onNext }: { onNext: () => void }) {
  const { pet } = useQuiz();
  const today = new Date().toISOString().slice(0, 10);
  const opts: [Origin, string, string][] = [
    ['nascimento', 'Nasceu com a gente', '🍼'],
    ['adocao', g(pet, 'Foi adotado', 'Foi adotada'), '🏡'],
  ];
  return (
    <Screen title={`Como ${oPet(pet)} chegou na sua vida?`} subtitle="Define se vem a certidão de nascimento ou de adoção.">
      <div className="grid grid-cols-2 gap-3">
        {opts.map(([id, label, emoji]) => (
          <button key={id} type="button" data-selected={pet.origin === id} onClick={() => quizStore.setPet({ origin: id })} className="option !flex-col !gap-2 !py-5 text-center">
            <span className="text-4xl">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      {pet.origin && (
        <div className="anim-fade-up mt-6">
          <Label>{pet.origin === 'adocao' ? 'Data da adoção' : 'Data de nascimento'} (se souber)</Label>
          <input type="date" className="input" max={today} value={pet.date ?? ''} onChange={(e) => quizStore.setPet({ date: e.target.value })} />
          <p className="mt-2 text-sm font-semibold text-cacau/60">Não sabe a data certinha? Pode deixar em branco e completar depois.</p>
        </div>
      )}
      <Continue onClick={onNext} />
    </Screen>
  );
}

function ColorStep({ settings, onNext }: { settings: SiteSettings; onNext: () => void }) {
  const s = useQuiz();
  const pet = s.pet;
  const color = defaultRgColor(pet);
  const ctx = useMemo(
    () => buildDocContext({ pet: { ...pet, rgColor: color }, settings, seed: s.lead?.petId || pet.name || 'pet', slug: s.lead?.slug, phone: s.contact.phone, preview: true }),
    [pet, color, settings, s.lead, s.contact.phone],
  );
  return (
    <Screen title={`Escolha a cor do RG ${doPet(pet)}`} subtitle="Toque nas cores pra ver ao vivo.">
      <div className="anim-pop">
        <DocImage doc="rg" ctx={ctx} scale={0.62} className="drop-shadow-xl" />
      </div>
      <div className="mt-6 flex justify-center gap-3">
        {(Object.keys(rgColors) as RgColor[]).map((c) => (
          <button
            key={c}
            type="button"
            aria-label={rgColors[c].label}
            onClick={() => quizStore.setPet({ rgColor: c })}
            className={`h-12 w-12 rounded-full border-4 transition-transform active:scale-90 ${color === c ? 'scale-110 border-cacau' : 'border-white'}`}
            style={{ background: rgColors[c].main, boxShadow: '0 4px 12px -4px rgba(0,0,0,.3)' }}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-bold text-cacau/60">{rgColors[color].label}</p>
      <Continue onClick={onNext} label="Ficou lindo! Continuar" />
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
    <Screen title={title} subtitle="Assim que liberar, o acesso chega no seu WhatsApp e e-mail.">
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
      {nudge && !contact.consent && <p className="mt-1 px-3 text-sm font-bold text-[#B45309]">Marque a caixinha pra gente poder guardar o kit no seu nome 💛</p>}
      <p className="mt-4 text-center text-sm font-bold text-cacau/60">🔒 Seus dados ficam protegidos. Nada de spam.</p>
      <Continue onClick={submit} label="Ver o kit pronto" />
    </Screen>
  );
}
