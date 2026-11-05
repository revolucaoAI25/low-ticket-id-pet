'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { rgColors, type RgColor } from '@/config/brand';
import { bonusItems, kitItems } from '@/config/offer';
import type { SiteSettings } from '@/config/site';
import { DocImage } from '@/components/DocImage';
import { BreedPicker } from '@/components/quiz/BreedPicker';
import { PhotoPicker } from '@/components/quiz/PhotoPicker';
import { TeamPicker } from '@/components/quiz/TeamPicker';
import { Logo } from '@/components/ui';
import { buildDocContext } from '@/lib/doc-context';
import { formatPhone } from '@/lib/format';
import { DOCS, downloadPdf, downloadPng, fileName, KIT_DOC_IDS, type DocContext } from '@/lib/docs/render';
import { PERSONALITIES, PLACES, defaultRgColor, doPet, fill, g, hasName, petName, type PetData, type PetExtras } from '@/lib/pet';
import { quizStore } from '@/lib/quiz-store';
import { SPECIES, getSpecies } from '@/lib/species';
import { allTeams } from '@/lib/teams';
import { buildCheckoutUrl, track } from '@/lib/tracking';

interface PetView {
  id: string;
  slug: string;
  data: PetData;
  lostMode: boolean;
  lostSince: string | null;
}

interface AreaData {
  paid: boolean;
  refunded?: boolean;
  customer?: { email: string | null; phone: string | null; name: string | null };
  petsAllowed?: number;
  pets?: PetView[];
  files?: SiteSettings['files'];
  extraPetCheckout?: string;
}

export function KitArea({ token, settings }: { token: string; settings: SiteSettings }) {
  const [data, setData] = useState<AreaData | null>(null);
  const [error, setError] = useState('');
  const [sel, setSel] = useState(0);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/area?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      if (r.status === 404) return setError('Não encontramos esse acesso. Confira o link do e-mail.');
      if (!r.ok) return setError('Não foi possível carregar agora. Tente de novo em instantes.');
      setData(await r.json());
    } catch {
      setError('Sem conexão. Tente de novo.');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Ainda não pago: consulta de novo a cada 5 s.
  useEffect(() => {
    if (!data || data.paid || data.refunded) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [data, load]);

  const call = useCallback(
    async (payload: Record<string, unknown>) => {
      const r = await fetch('/api/area', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, ...payload }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'erro');
      return d;
    },
    [token],
  );

  const updatePet = useCallback(
    async (petId: string, patch: Partial<PetData>) => {
      const d = await call({ action: 'update', petId, data: patch });
      setData((cur) => (cur ? { ...cur, pets: cur.pets?.map((p) => (p.id === petId ? d.pet : p)) } : cur));
    },
    [call],
  );

  if (error)
    return (
      <Shell>
        <p className="card mt-8 p-6 text-center font-bold">{error}</p>
      </Shell>
    );
  if (!data)
    return (
      <Shell>
        <div className="mx-auto mt-16 h-14 w-14 animate-spin rounded-full border-[6px] border-linha border-t-roxo" />
      </Shell>
    );
  if (!data.paid)
    return (
      <Shell>
        <div className="card mt-8 p-6 text-center">
          {data.refunded ? (
            <p className="font-bold">Este acesso foi cancelado (reembolso). Se foi um engano, fale com {settings.support.email}.</p>
          ) : (
            <>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[5px] border-linha border-t-roxo" />
              <h1 className="h-display mt-4 text-2xl">Aguardando a confirmação do pagamento</h1>
              <p className="mt-2 font-semibold text-cacau/70">Assim que confirmar, esta página libera os documentos sozinha.</p>
            </>
          )}
        </div>
      </Shell>
    );

  const pets = data.pets ?? [];
  const pet = pets[Math.min(sel, pets.length - 1)];

  return (
    <Shell>
      {pets.length === 0 ? (
        <FirstPet call={call} onCreated={load} />
      ) : (
        <>
          {pets.length > 1 && (
            <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
              {pets.map((p, i) => (
                <button key={p.id} type="button" onClick={() => setSel(i)} className={`shrink-0 rounded-full px-4 py-2 font-bold ${i === sel ? 'bg-roxo text-white' : 'bg-white shadow-card'}`}>
                  {getSpecies(p.data.species)?.emoji ?? '🐾'} {petName(p.data)}
                </button>
              ))}
            </div>
          )}
          <PetPanel
            key={pet.id}
            pet={pet}
            settings={settings}
            phone={data.customer?.phone ?? ''}
            files={data.files}
            onUpdate={(patch) => updatePet(pet.id, patch)}
            onLost={async (on) => {
              const d = await call({ action: 'lost', petId: pet.id, on });
              setData((cur) => (cur ? { ...cur, pets: cur.pets?.map((p) => (p.id === pet.id ? d.pet : p)) } : cur));
            }}
            onPhone={async (phone) => {
              await call({ action: 'contact', phone });
              setData((cur) => (cur ? { ...cur, customer: { ...cur.customer!, phone } } : cur));
            }}
          />
          <AddPet
            canCreate={pets.length < (data.petsAllowed ?? 1)}
            checkout={data.extraPetCheckout ?? ''}
            email={data.customer?.email ?? ''}
            phone={data.customer?.phone ?? ''}
            settings={settings}
            onCreate={async (d) => {
              await call({ action: 'create', data: d });
              await load();
              setSel(pets.length);
            }}
          />
        </>
      )}
      <footer className="mt-12 text-center text-xs font-semibold leading-relaxed text-cacau/55">
        Guarde o link desta página: é o seu acesso ao kit.
        <br />
        Suporte: {settings.support.email}
        <br />
        <br />
        Produto digital personalizado de uso pessoal. Não tem validade oficial e não substitui documentos emitidos por médico-veterinário ou órgãos públicos.
      </footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[520px] px-4 pb-16 pt-4">
      <div className="flex justify-center">
        <Logo size={96} priority />
      </div>
      {children}
    </div>
  );
}

/* ---------------- painel de um pet ---------------- */

function PetPanel({
  pet,
  settings,
  phone,
  files,
  onUpdate,
  onLost,
  onPhone,
}: {
  pet: PetView;
  settings: SiteSettings;
  phone: string;
  files?: SiteSettings['files'];
  onUpdate: (p: Partial<PetData>) => Promise<void>;
  onLost: (on: boolean) => Promise<void>;
  onPhone: (phone: string) => Promise<void>;
}) {
  const p = pet.data;
  const ctx = useMemo(() => buildDocContext({ pet: p, settings, seed: pet.id, slug: pet.slug, phone }), [p, settings, pet.id, pet.slug, phone]);
  const [busy, setBusy] = useState('');
  const doNome = hasName(p) ? doPet(p) : 'do seu pet';

  useEffect(() => {
    track('AreaDoPet', {}, { pixel: false });
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch {
      alert('Não consegui gerar o arquivo. Tente de novo.');
    } finally {
      setBusy('');
    }
  }

  const fileFor = (id: string) => {
    if (!files) return '';
    if (id === 'calendario') return p.species === 'gato' ? files.calendarioGato : p.species === 'cachorro' ? files.calendarioCao : files.calendarioOutros || files.calendarioCao;
    if (id === 'viagem') return files.guiaViagem;
    return '';
  };

  return (
    <div>
      <section className="pt-4 text-center">
        <h1 className="h-display text-[28px] leading-tight">O kit {doNome} está liberado! 🎉</h1>
        <p className="mt-1 font-semibold text-cacau/70">Baixe, imprima e, se quiser, complete os dados logo abaixo.</p>
      </section>

      <button
        type="button"
        disabled={!!busy}
        onClick={() =>
          run('all', async () => {
            await downloadPdf(
              KIT_DOC_IDS.map((id) => DOCS[id]),
              ctx,
              fileName({ ...DOCS.rg, file: 'Kit-Identidade-Pet-{nome}' }, ctx),
              (n, t) => setBusy(`all:${Math.round((n / t) * 100)}`),
            );
            track('BaixouKit', { formato: 'pdf-completo' }, { pixel: false });
          })
        }
        className="btn-cta shine mt-5"
      >
        {busy.startsWith('all') ? `Gerando PDF… ${busy.split(':')[1] ?? ''}%` : '⬇️ Baixar o kit completo (PDF para imprimir)'}
      </button>
      <p className="mt-2 text-center text-xs font-bold text-cacau/55">Folhas A4 com tudo em tamanho real e linha de corte.</p>

      <h2 className="h-display mt-8 text-xl">Documentos</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {kitItems.map((it) => (
          <DocCard key={it.id} title={fill(it.title, p)} doc={it.doc!} ctx={ctx} busy={busy} run={run} />
        ))}
      </div>

      <h2 className="h-display mt-8 text-xl">Bônus</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {bonusItems.map((b) =>
          b.doc ? (
            <DocCard key={b.id} title={fill(b.title, p)} doc={b.doc} ctx={ctx} busy={busy} run={run} badge="Personalizado" />
          ) : (
            <div key={b.id} className="card flex flex-col p-3">
              <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#F7EEF8] to-[#FFF1E0]">
                {settings.images[b.imageKey] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.images[b.imageKey]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl">{b.emoji}</span>
                )}
              </div>
              <p className="mt-2 text-[14px] font-extrabold leading-tight">{b.title}</p>
              {fileFor(b.id) ? (
                <a href={fileFor(b.id)} target="_blank" rel="noreferrer" className="btn-primary mt-auto !min-h-[40px] !text-sm" download>
                  Baixar PDF
                </a>
              ) : (
                <span className="mt-auto pt-2 text-xs font-bold text-cacau/50">Disponível em breve</span>
              )}
            </div>
          ),
        )}
      </div>

      <TagSection pet={pet} ctx={ctx} phone={phone} onUpdate={onUpdate} onLost={onLost} onPhone={onPhone} />

      <CompleteSection pet={pet} settings={settings} onUpdate={onUpdate} />
    </div>
  );
}

function DocCard({ title, doc, ctx, busy, run, badge }: { title: string; doc: string; ctx: DocContext; busy: string; run: (l: string, fn: () => Promise<void>) => void; badge?: string }) {
  const def = DOCS[doc];
  const [page, setPage] = useState(0);
  return (
    <div className="card flex flex-col p-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-areia/60 p-2">
        <DocImage doc={doc} page={page} ctx={ctx} scale={0.3} className="max-h-full w-full" />
        {badge && <span className="absolute left-2 top-2 rounded-full bg-roxo px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">{badge}</span>}
      </div>
      {def.pages.length > 1 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {def.pages.map((pg, i) => (
            <button key={pg.id} type="button" onClick={() => setPage(i)} className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${i === page ? 'bg-cacau text-white' : 'bg-areia'}`}>
              {pg.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[14px] font-extrabold leading-tight">{title}</p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run(`pdf:${doc}`, () => downloadPdf([def], ctx, fileName(def, ctx)))}
          className="rounded-xl bg-roxo py-2 text-sm font-extrabold text-white disabled:opacity-50"
        >
          {busy === `pdf:${doc}` ? '…' : 'PDF'}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run(`png:${doc}`, () => downloadPng(def, ctx))}
          className="rounded-xl border-2 border-linha bg-white py-2 text-sm font-extrabold disabled:opacity-50"
        >
          {busy === `png:${doc}` ? '…' : 'Imagem'}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Tag + Modo Perdido ---------------- */

function TagSection({
  pet,
  ctx,
  phone,
  onUpdate,
  onLost,
  onPhone,
}: {
  pet: PetView;
  ctx: DocContext;
  phone: string;
  onUpdate: (p: Partial<PetData>) => Promise<void>;
  onLost: (on: boolean) => Promise<void>;
  onPhone: (phone: string) => Promise<void>;
}) {
  const url = `${ctx.siteUrl}/p/${pet.slug}`;
  const [saving, setSaving] = useState(false);
  const [ph, setPh] = useState(formatPhone(phone));
  const ex = pet.data.extras ?? {};
  const [msg, setMsg] = useState(ex.lostMessage ?? '');
  const [reward, setReward] = useState(ex.reward ?? '');

  return (
    <section className="mt-10">
      <h2 className="h-display text-xl">Tag com QR Code e página {doPet(pet.data)}</h2>
      <div className="card mt-3 p-4">
        <div className="flex items-center gap-4">
          <div className="w-28 shrink-0">
            <DocImage doc="tag" ctx={ctx} scale={0.25} />
          </div>
          <div className="min-w-0 text-[14px] font-semibold">
            <p>Quem escanear a tag abre esta página:</p>
            <a href={url} target="_blank" rel="noreferrer" className="mt-1 block break-all font-extrabold text-roxo underline">
              {url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-extrabold uppercase tracking-wide text-cacau/60">WhatsApp do tutor (aparece na página e no RG)</label>
          <div className="mt-2 flex gap-2">
            <input className="input !min-h-[48px] !text-base" type="tel" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="(11) 91234-5678" />
            <button type="button" className="btn-primary !min-h-[48px] !px-4 !text-base" onClick={() => onPhone(ph)}>
              Salvar
            </button>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-3 text-[14px] font-bold">
          <input type="checkbox" className="h-5 w-5 accent-[#6F2A7A]" checked={ex.showPhone !== false} onChange={(e) => onUpdate({ extras: { ...ex, showPhone: e.target.checked } })} />
          Mostrar meu telefone na página pública
        </label>
      </div>

      <div className={`mt-4 rounded-3xl border-2 p-4 ${pet.lostMode ? 'border-red-400 bg-red-50' : 'border-linha bg-white'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold">🚨 Modo Perdido</p>
            <p className="text-[13px] font-semibold text-cacau/70">
              {pet.lostMode ? 'ATIVADO: a página mostra um aviso em destaque pra quem escanear.' : `Ative se ${petName(pet.data)} sumir. A página passa a pedir ajuda em destaque.`}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pet.lostMode}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onLost(!pet.lostMode).catch(() => undefined);
              setSaving(false);
            }}
            className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${pet.lostMode ? 'bg-red-500' : 'bg-linha'}`}
          >
            <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${pet.lostMode ? 'left-8' : 'left-1'}`} />
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <textarea className="input !min-h-[80px] py-3 !text-base" placeholder="Mensagem para quem encontrar (ex.: ele é medroso, chame pelo nome com calma)" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <input className="input !min-h-[48px] !text-base" placeholder="Recompensa (opcional)" value={reward} onChange={(e) => setReward(e.target.value)} />
          <button type="button" className="btn-ghost w-full !min-h-[44px] !text-base" onClick={() => onUpdate({ extras: { ...ex, lostMessage: msg, reward } })}>
            Salvar mensagem
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Completar dados ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-cacau/60">{label}</span>
      {children}
    </label>
  );
}

function Group({ title, emoji, done, children, onSave }: { title: string; emoji: string; done: boolean; children: React.ReactNode; onSave: () => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  return (
    <details className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 font-extrabold">
        <span className="text-xl">{emoji}</span>
        <span className="flex-1">{title}</span>
        {done && <span className="rounded-full bg-[#E6F4EA] px-2 py-0.5 text-[11px] text-verde">✓ preenchido</span>}
        <span className="text-roxo transition-transform group-open:rotate-45">＋</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">
        {children}
        <button
          type="button"
          className="btn-primary w-full !min-h-[48px] !text-base"
          disabled={state === 'saving'}
          onClick={async () => {
            setState('saving');
            try {
              await onSave();
              setState('saved');
              setTimeout(() => setState('idle'), 1800);
            } catch {
              setState('idle');
              alert('Não consegui salvar. Tente de novo.');
            }
          }}
        >
          {state === 'saving' ? 'Salvando…' : state === 'saved' ? '✓ Salvo! Documentos atualizados' : 'Salvar'}
        </button>
      </div>
    </details>
  );
}

function CompleteSection({ pet, settings, onUpdate }: { pet: PetView; settings: SiteSettings; onUpdate: (p: Partial<PetData>) => Promise<void> }) {
  const [d, setD] = useState<PetData>(pet.data);
  const ex = d.extras ?? {};
  const setEx = (patch: Partial<PetExtras>) => setD((cur) => ({ ...cur, extras: { ...(cur.extras ?? {}), ...patch } }));
  const teams = useMemo(() => allTeams(settings.extraTeams), [settings.extraTeams]);
  const species = getSpecies(d.species);
  const contacts = ex.contacts?.length ? ex.contacts : [{ name: '', phone: '', relation: '' }];
  const color = defaultRgColor(d);
  const saveExtras = () => onUpdate({ extras: { ...(pet.data.extras ?? {}), ...ex } });

  return (
    <section className="mt-10">
      <h2 className="h-display text-xl">Quer deixar o kit 100% completo?</h2>
      <p className="mt-1 text-[14px] font-semibold text-cacau/70">Tudo opcional. Cada parte que você salva atualiza os documentos na hora.</p>
      <div className="mt-4 space-y-3">
        <Group title="Foto e cor do RG" emoji="📸" done={!!pet.data.photo} onSave={() => onUpdate({ photo: d.photo, rgColor: d.rgColor })}>
          <PhotoPicker value={d.photo} emoji={species?.emoji ?? '🐾'} onChange={(photo) => setD((c) => ({ ...c, photo }))} />
          <div className="flex justify-center gap-3 pt-2">
            {(Object.keys(rgColors) as RgColor[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-label={rgColors[c].label}
                onClick={() => setD((cur) => ({ ...cur, rgColor: c }))}
                className={`h-10 w-10 rounded-full border-4 ${color === c ? 'border-cacau' : 'border-white'}`}
                style={{ background: rgColors[c].main }}
              />
            ))}
          </div>
        </Group>

        <Group title="Dados principais" emoji="🐾" done={!!(pet.data.name && pet.data.breed && pet.data.date)} onSave={() => onUpdate({ ...d, extras: undefined, photo: undefined })}>
          <Field label="Nome">
            <input className="input" value={d.name ?? ''} onChange={(e) => setD({ ...d, name: e.target.value })} />
          </Field>
          <Field label="Espécie">
            <select className="input" value={d.species ?? ''} onChange={(e) => setD({ ...d, species: e.target.value as PetData['species'] })}>
              <option value="">—</option>
              {SPECIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Raça">
            <BreedPicker breeds={species?.breeds ?? []} value={d.breed ?? ''} onChange={(v) => setD({ ...d, breed: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <select className="input" value={d.sex ?? ''} onChange={(e) => setD({ ...d, sex: e.target.value as PetData['sex'] })}>
                <option value="">—</option>
                <option value="macho">Macho</option>
                <option value="femea">Fêmea</option>
              </select>
            </Field>
            <Field label="Personalidade">
              <select className="input" value={d.personality ?? ''} onChange={(e) => setD({ ...d, personality: e.target.value as PetData['personality'] })}>
                <option value="">—</option>
                {Object.entries(PERSONALITIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {g(d, v.m, v.f)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Certidão">
              <select className="input" value={d.origin ?? ''} onChange={(e) => setD({ ...d, origin: e.target.value as PetData['origin'] })}>
                <option value="nascimento">Nascimento</option>
                <option value="adocao">Adoção</option>
              </select>
            </Field>
            <Field label={d.origin === 'adocao' ? 'Data da adoção' : 'Nascimento'}>
              <input className="input" type="date" value={d.date ?? ''} onChange={(e) => setD({ ...d, date: e.target.value })} />
            </Field>
          </div>
          <Field label="Lugar favorito">
            <select className="input" value={d.place ?? ''} onChange={(e) => setD({ ...d, place: e.target.value as PetData['place'] })}>
              <option value="">—</option>
              {Object.entries(PLACES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.emoji} {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tutores">
            <input className="input" value={d.tutors ?? ''} onChange={(e) => setD({ ...d, tutors: e.target.value })} />
          </Field>
          <Field label="Cidade">
            <input className="input" value={d.city ?? ''} onChange={(e) => setD({ ...d, city: e.target.value })} />
          </Field>
        </Group>

        <Group title="Time do coração" emoji="⚽" done={!!pet.data.team} onSave={() => onUpdate({ team: d.team })}>
          <p className="text-sm font-bold">Atual: {d.team?.none ? 'Não torce' : d.team?.name || '—'}</p>
          <TeamPicker teams={teams} value={d.team} onPick={(t) => setD({ ...d, team: t })} />
        </Group>

        <Group title="Identificação" emoji="🔎" done={!!(pet.data.extras?.microchip || pet.data.extras?.coat)} onSave={saveExtras}>
          <Field label="Nº do microchip">
            <input className="input" value={ex.microchip ?? ''} onChange={(e) => setEx({ microchip: e.target.value })} />
          </Field>
          <Field label="Nº do RG Animal (SinPatinhas), se tiver">
            <input className="input" value={ex.rgAnimal ?? ''} onChange={(e) => setEx({ rgAnimal: e.target.value })} />
          </Field>
          <Field label="Pelagem e sinais">
            <input className="input" placeholder="Ex.: caramelo com mancha branca no peito" value={ex.coat ?? ''} onChange={(e) => setEx({ coat: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Porte">
              <input className="input" placeholder="Pequeno" value={ex.size ?? ''} onChange={(e) => setEx({ size: e.target.value })} />
            </Field>
            <Field label="Peso">
              <input className="input" placeholder="8 kg" value={ex.weight ?? ''} onChange={(e) => setEx({ weight: e.target.value })} />
            </Field>
          </div>
        </Group>

        <Group title="Saúde" emoji="🩺" done={!!(pet.data.extras?.allergies || pet.data.extras?.medications)} onSave={saveExtras}>
          <Field label="Alergias">
            <input className="input" value={ex.allergies ?? ''} onChange={(e) => setEx({ allergies: e.target.value })} />
          </Field>
          <Field label="Remédios de uso contínuo">
            <input className="input" value={ex.medications ?? ''} onChange={(e) => setEx({ medications: e.target.value })} />
          </Field>
          <Field label="Condições / cuidados especiais">
            <input className="input" value={ex.conditions ?? ''} onChange={(e) => setEx({ conditions: e.target.value })} />
          </Field>
        </Group>

        <Group title="Veterinário" emoji="🏥" done={!!(pet.data.extras?.vetName || pet.data.extras?.vetClinic)} onSave={saveExtras}>
          <Field label="Nome do(a) veterinário(a)">
            <input className="input" value={ex.vetName ?? ''} onChange={(e) => setEx({ vetName: e.target.value })} />
          </Field>
          <Field label="Clínica">
            <input className="input" value={ex.vetClinic ?? ''} onChange={(e) => setEx({ vetClinic: e.target.value })} />
          </Field>
          <Field label="Telefone da clínica">
            <input className="input" type="tel" value={ex.vetPhone ?? ''} onChange={(e) => setEx({ vetPhone: e.target.value })} />
          </Field>
        </Group>

        <Group title="Contatos de emergência" emoji="📞" done={!!pet.data.extras?.contacts?.length} onSave={saveExtras}>
          {contacts.map((c, i) => (
            <div key={i} className="space-y-2 rounded-2xl bg-areia/50 p-3">
              <input
                className="input !min-h-[48px] !text-base"
                placeholder="Nome"
                value={c.name}
                onChange={(e) => setEx({ contacts: contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input !min-h-[48px] !text-base"
                  placeholder="Telefone"
                  type="tel"
                  value={c.phone}
                  onChange={(e) => setEx({ contacts: contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) })}
                />
                <input
                  className="input !min-h-[48px] !text-base"
                  placeholder="Parentesco"
                  value={c.relation ?? ''}
                  onChange={(e) => setEx({ contacts: contacts.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)) })}
                />
              </div>
            </div>
          ))}
          {contacts.length < 3 && (
            <button type="button" className="text-sm font-extrabold text-roxo" onClick={() => setEx({ contacts: [...contacts, { name: '', phone: '', relation: '' }] })}>
              + adicionar contato
            </button>
          )}
        </Group>

        <Group title="Rotina (para o Kit Quem Cuida)" emoji="📋" done={!!(pet.data.extras?.food || pet.data.extras?.walks)} onSave={saveExtras}>
          <Field label="Ração / comida">
            <input className="input" value={ex.food ?? ''} onChange={(e) => setEx({ food: e.target.value })} />
          </Field>
          <Field label="Horários e quantidade">
            <input className="input" placeholder="Ex.: 8h e 18h, 1 xícara" value={ex.feedingTimes ?? ''} onChange={(e) => setEx({ feedingTimes: e.target.value })} />
          </Field>
          <Field label="Passeios e brincadeiras">
            <input className="input" value={ex.walks ?? ''} onChange={(e) => setEx({ walks: e.target.value })} />
          </Field>
          <Field label="Manias e o que ama">
            <input className="input" value={ex.habits ?? ''} onChange={(e) => setEx({ habits: e.target.value })} />
          </Field>
          <Field label="O que não pode">
            <input className="input" value={ex.forbidden ?? ''} onChange={(e) => setEx({ forbidden: e.target.value })} />
          </Field>
        </Group>
      </div>
    </section>
  );
}

/* ---------------- Adicionar pet ---------------- */

function AddPet({
  canCreate,
  checkout,
  email,
  phone,
  settings,
  onCreate,
}: {
  canCreate: boolean;
  checkout: string;
  email: string;
  phone: string;
  settings: SiteSettings;
  onCreate: (d: PetData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetData['species']>('cachorro');
  const [saving, setSaving] = useState(false);

  if (!canCreate) {
    const url = checkout ? buildCheckoutUrl({ baseUrl: checkout, params: settings.checkoutParams, email, phone }) : '';
    return (
      <section className="mt-10 rounded-3xl bg-gradient-to-br from-[#F7EEF8] to-[#FFF1E0] p-5 text-center">
        <p className="text-3xl">🐶🐱</p>
        <h2 className="h-display mt-1 text-xl">Tem mais um pet em casa?</h2>
        <p className="mt-1 text-[14px] font-semibold text-cacau/75">Monte o kit completo dele também, com todos os documentos e bônus.</p>
        {url ? (
          <a href={url} onClick={() => track('CliqueMaisUmPet', {}, { pixel: false })} className="btn-cta mt-4">
            Adicionar outro pet · R$ 9,90
          </a>
        ) : (
          <p className="mt-3 text-xs font-bold text-cacau/50">(Checkout do pet adicional ainda não configurado.)</p>
        )}
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-3xl bg-gradient-to-br from-[#E6F4EA] to-[#FFF8EF] p-5">
      <h2 className="h-display text-xl">Você tem mais um pet liberado 🎉</h2>
      {!open ? (
        <button type="button" className="btn-primary mt-3 w-full" onClick={() => setOpen(true)}>
          Cadastrar outro pet
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <input className="input" placeholder="Nome do pet" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="input" value={species} onChange={(e) => setSpecies(e.target.value as PetData['species'])}>
            {SPECIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onCreate({ name, species }).catch(() => alert('Não consegui criar. Tente de novo.'));
              setSaving(false);
              setOpen(false);
            }}
          >
            {saving ? 'Criando…' : 'Criar kit'}
          </button>
        </div>
      )}
    </section>
  );
}

/** Comprou sem pet cadastrado (ex.: outro aparelho ou pulou o contato): começa daqui, aproveitando o quiz se estiver neste navegador. */
function FirstPet({ call, onCreated }: { call: (p: Record<string, unknown>) => Promise<unknown>; onCreated: () => void }) {
  const local = quizStore.get().pet;
  const hasLocal = !!(local.name || local.species);
  const [name, setName] = useState(local.name ?? '');
  const [species, setSpecies] = useState<PetData['species']>(local.species ?? 'cachorro');
  const [saving, setSaving] = useState(false);
  return (
    <section className="card mt-6 p-5">
      <h1 className="h-display text-2xl">Pagamento confirmado! Vamos montar o kit 🐾</h1>
      <p className="mt-1 font-semibold text-cacau/70">
        {hasLocal ? `Encontramos o que você respondeu no quiz${local.name ? ` sobre ${local.name}` : ''}.` : 'Comece pelo nome e a espécie. O resto você completa na sequência.'}
      </p>
      <div className="mt-4 space-y-3">
        <input className="input" placeholder="Nome do pet" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="input" value={species} onChange={(e) => setSpecies(e.target.value as PetData['species'])}>
          {SPECIES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.emoji} {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await call({ action: 'create', data: hasLocal ? { ...local, name, species } : { name, species } });
              onCreated();
            } catch {
              alert('Não consegui criar. Tente de novo.');
            }
            setSaving(false);
          }}
        >
          {saving ? 'Criando…' : 'Montar o kit'}
        </button>
      </div>
    </section>
  );
}
