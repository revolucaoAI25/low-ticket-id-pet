'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { proofSlots, type ProofImage, type Review, type SiteSettings, type ExtraTeam } from '@/config/site';
import { bonusItems } from '@/config/offer';
import { Logo } from '@/components/ui';
import { allPages } from '@/lib/docs/render';
import { TEAMS } from '@/lib/teams';

type Tab = 'funil' | 'oferta' | 'checkout' | 'rastreamento' | 'prova' | 'imagens' | 'bonus' | 'times' | 'contato';
const TABS: [Tab, string][] = [
  ['funil', '📊 Funil'],
  ['oferta', '💰 Oferta'],
  ['checkout', '🛒 Checkouts'],
  ['rastreamento', '🎯 Pixel e UTMs'],
  ['prova', '⭐ Prova social'],
  ['imagens', '🖼️ Imagens'],
  ['bonus', '🎁 PDFs dos bônus'],
  ['times', '⚽ Times'],
  ['contato', '☎️ Suporte'],
];

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [s, setS] = useState<SiteSettings | null>(null);
  const [dbOk, setDbOk] = useState(true);
  const [tab, setTab] = useState<Tab>('funil');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'ok' | string>('idle');

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/settings', { cache: 'no-store' });
    if (r.status === 401) return setAuthed(false);
    const d = await r.json();
    setS(d.settings);
    setDbOk(d.db);
    setAuthed(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!s) return;
    setSaving('saving');
    const r = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(s) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setS(d.settings);
      setSaving('ok');
      setTimeout(() => setSaving('idle'), 2000);
    } else setSaving(d.error || 'Erro ao salvar');
  }

  if (authed === null) return <div className="p-10 text-center font-bold">Carregando…</div>;
  if (!authed) return <Login onOk={load} />;
  if (!s) return null;

  const set = (patch: Partial<SiteSettings>) => setS({ ...s, ...patch });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6">
      <div className="flex items-center justify-between">
        <Logo size={80} />
        <button
          type="button"
          className="text-sm font-bold text-cacau/60 underline"
          onClick={async () => {
            await fetch('/api/admin/login', { method: 'DELETE' });
            setAuthed(false);
          }}
        >
          Sair
        </button>
      </div>
      <h1 className="h-display mt-2 text-3xl">Painel</h1>
      {!dbOk && <p className="mt-3 rounded-xl bg-red-50 p-3 font-bold text-red-700">Supabase não configurado: as mudanças não serão salvas. Veja o README.</p>}

      <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tab === id ? 'bg-roxo text-white' : 'bg-white shadow-card'}`}>
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-4 space-y-4">
        {tab === 'funil' && <Funnel />}

        {tab === 'oferta' && (
          <Card title="Preço, ancoragem e números">
            <Grid>
              <Num label="Preço (R$)" value={s.price} step={0.1} onChange={(v) => set({ price: v })} />
              <Num label="Preço de ancoragem — 'De' (R$)" value={s.anchorPrice} onChange={(v) => set({ anchorPrice: v })} />
              <Num label="Timer do desconto (minutos)" value={s.timerMinutes} onChange={(v) => set({ timerMinutes: v })} />
              <Num label="Nota (estrelas)" value={s.rating} step={0.1} onChange={(v) => set({ rating: Math.min(5, v) })} />
              <Num label="Nº de tutores (0 = esconder)" value={s.tutorsCount} onChange={(v) => set({ tutorsCount: v })} />
            </Grid>
            <p className="mt-3 text-sm text-cacau/70">
              Desconto mostrado: <b>-{Math.round((1 - s.price / s.anchorPrice) * 100)}% aplicado</b>. Os valores de cada item do kit ficam em <code>src/config/offer.ts</code>.
            </p>
          </Card>
        )}

        {tab === 'checkout' && (
          <>
            <Card title="Links de checkout (Kiwify)" hint="O quiz escolhe o link pela espécie. Pássaro, peixe, roedor e outros usam o de 'Outros pets'.">
              <Text label="🐶 Cachorro" value={s.checkout.cachorro} onChange={(v) => set({ checkout: { ...s.checkout, cachorro: v } })} placeholder="https://pay.kiwify.com.br/..." />
              <Text label="🐱 Gato" value={s.checkout.gato} onChange={(v) => set({ checkout: { ...s.checkout, gato: v } })} placeholder="https://pay.kiwify.com.br/..." />
              <Text label="🐾 Outros pets" value={s.checkout.outros} onChange={(v) => set({ checkout: { ...s.checkout, outros: v } })} placeholder="https://pay.kiwify.com.br/..." />
              <Text
                label="➕ Pet adicional (R$ 9,90, vendido dentro da área do pet)"
                value={s.checkout.extraPet}
                onChange={(v) => set({ checkout: { ...s.checkout, extraPet: v } })}
                placeholder="https://pay.kiwify.com.br/..."
              />
            </Card>
            <Card title="Como reconhecer o '+1 pet' no webhook" hint="Palavras (sem acento) que aparecem no nome do produto ou do order bump do pet adicional. Separe por vírgula.">
              <Text label="Palavras-chave" value={s.extraPetKeywords.join(', ')} onChange={(v) => set({ extraPetKeywords: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
            </Card>
            <Card title="Parâmetros de preenchimento do checkout" hint="Nome dos campos na URL do checkout. O padrão da Kiwify é name, email e phone.">
              <Grid>
                <Text label="Nome" value={s.checkoutParams.name} onChange={(v) => set({ checkoutParams: { ...s.checkoutParams, name: v } })} />
                <Text label="E-mail" value={s.checkoutParams.email} onChange={(v) => set({ checkoutParams: { ...s.checkoutParams, email: v } })} />
                <Text label="Telefone" value={s.checkoutParams.phone} onChange={(v) => set({ checkoutParams: { ...s.checkoutParams, phone: v } })} />
              </Grid>
            </Card>
          </>
        )}

        {tab === 'rastreamento' && (
          <Card title="Pixel da Meta e Utmify" hint="Veja o passo a passo completo em docs/INTEGRACOES.md.">
            <Text label="ID do Pixel da Meta (só números)" value={s.tracking.metaPixelId} onChange={(v) => set({ tracking: { ...s.tracking, metaPixelId: v } })} placeholder="123456789012345" />
            <label className="flex items-center gap-3 font-bold">
              <input type="checkbox" className="h-5 w-5" checked={s.tracking.utmifyUtms} onChange={(e) => set({ tracking: { ...s.tracking, utmifyUtms: e.target.checked } })} />
              Carregar o script de UTMs da Utmify
            </label>
            <Text
              label="ID do Pixel da Utmify (opcional, só se for usar o pixel deles)"
              value={s.tracking.utmifyPixelId}
              onChange={(v) => set({ tracking: { ...s.tracking, utmifyPixelId: v } })}
            />
            {s.tracking.metaPixelId && s.tracking.utmifyPixelId && (
              <p className="rounded-xl bg-[#FFF1E0] p-3 text-sm font-bold text-[#9A3412]">
                Atenção: com o Pixel da Meta e o Pixel da Utmify ligados juntos, os eventos podem contar em dobro. Use um dos dois.
              </p>
            )}
          </Card>
        )}

        {tab === 'prova' && <ProofTab s={s} set={set} />}

        {tab === 'imagens' && (
          <>
            <Card title="Abertura do quiz" hint="Mockup do kit em leque. Sem imagem, o site monta um com os próprios documentos.">
              <Upload label="Imagem do kit (abertura)" value={s.images.heroMockup} folder="abertura" onChange={(v) => set({ images: { ...s.images, heroMockup: v } })} />
            </Card>
            <Card title="Capas dos bônus">
              {bonusItems.map((b) => (
                <Upload key={b.id} label={b.title.replace('{do}', 'do [pet]')} value={s.images[b.imageKey]} folder="bonus" onChange={(v) => set({ images: { ...s.images, [b.imageKey]: v } })} />
              ))}
            </Card>
            <Card
              title="Fundos prontos dos documentos"
              hint="Quando a IA de imagens entregar os templates, suba aqui o fundo de cada página (sem os dados escritos). O código continua escrevendo foto, nome e campos por cima. Pode ser preciso ajustar as posições em src/lib/docs/templates."
            >
              {allPages().map(({ doc, page }) => (
                <Upload
                  key={page.id}
                  label={`${doc} — ${page.label} (${page.w * 2}×${page.h * 2} px)`}
                  value={s.images.templates[page.id] ?? ''}
                  folder="templates"
                  onChange={(v) => set({ images: { ...s.images, templates: { ...s.images.templates, [page.id]: v } } })}
                />
              ))}
            </Card>
          </>
        )}

        {tab === 'bonus' && (
          <Card title="PDFs fixos dos bônus" hint="Aparecem para download na área do pet.">
            <Upload pdf label="Calendário de Saúde — Cão" value={s.files.calendarioCao} folder="pdfs" onChange={(v) => set({ files: { ...s.files, calendarioCao: v } })} />
            <Upload pdf label="Calendário de Saúde — Gato" value={s.files.calendarioGato} folder="pdfs" onChange={(v) => set({ files: { ...s.files, calendarioGato: v } })} />
            <Upload pdf label="Calendário de Saúde — Outros pets (opcional)" value={s.files.calendarioOutros} folder="pdfs" onChange={(v) => set({ files: { ...s.files, calendarioOutros: v } })} />
            <Upload pdf label="Guia: Como Viajar com seu Pet" value={s.files.guiaViagem} folder="pdfs" onChange={(v) => set({ files: { ...s.files, guiaViagem: v } })} />
          </Card>
        )}

        {tab === 'times' && <TeamsTab s={s} set={set} />}

        {tab === 'contato' && (
          <Card title="Suporte e empresa">
            <Text label="E-mail de suporte" value={s.support.email} onChange={(v) => set({ support: { ...s.support, email: v } })} />
            <Text label="WhatsApp de suporte" value={s.support.whatsapp} onChange={(v) => set({ support: { ...s.support, whatsapp: v } })} />
            <Text label="Horário de atendimento" value={s.support.hours} onChange={(v) => set({ support: { ...s.support, hours: v } })} />
            <Text label="Nome da empresa (rodapé e políticas)" value={s.company.name} onChange={(v) => set({ company: { ...s.company, name: v } })} />
            <Text label="CNPJ / CPF (rodapé e políticas)" value={s.company.document} onChange={(v) => set({ company: { ...s.company, document: v } })} />
          </Card>
        )}
      </div>

      {tab !== 'funil' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <p className="flex-1 text-sm font-bold text-cacau/70">
              {saving === 'ok' ? '✓ Salvo! O site atualiza na hora.' : saving !== 'idle' && saving !== 'saving' ? `⚠️ ${saving}` : 'Alterações só valem depois de salvar.'}
            </p>
            <button type="button" className="btn-primary !min-h-[48px]" onClick={save} disabled={saving === 'saving'}>
              {saving === 'saving' ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- abas ---------------- */

const STEP_NAMES = ['Abertura', 'Espécie', 'Nome', 'Raça e sexo', 'Personalidade', 'Origem', 'Lugar favorito', 'Time', 'Tutores', 'Foto', 'Cor do RG', 'Contato', 'Carregando'];

function Funnel() {
  const [days, setDays] = useState(7);
  const [d, setD] = useState<{ funnel: { event: string; step: number | null; sessions: number }[]; leads: number; paid: number; missingTeams: [string, number][] } | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setD(null);
    fetch(`/api/admin/stats?days=${days}`)
      .then(async (r) => (r.ok ? setD(await r.json()) : setErr((await r.json()).error)))
      .catch(() => setErr('Erro ao carregar'));
  }, [days]);
  const steps = useMemo(() => {
    const map = new Map<number, number>();
    d?.funnel.filter((f) => f.event === 'QuizEtapa' && f.step !== null).forEach((f) => map.set(f.step!, Number(f.sessions)));
    return STEP_NAMES.map((name, i) => ({ name, n: map.get(i) ?? 0 }));
  }, [d]);
  const ev = (e: string) => Number(d?.funnel.filter((f) => f.event === e).reduce((s, f) => s + Number(f.sessions), 0) ?? 0);
  const top = Math.max(1, steps[0]?.n ?? 1);
  const rows = [...steps, { name: 'Viu a oferta', n: ev('VerOferta') }, { name: 'Clicou em comprar', n: ev('CliqueComprar') }];

  if (err) return <Card title="Funil">{err}</Card>;
  return (
    <>
      <div className="flex gap-2">
        {[1, 7, 30].map((n) => (
          <button key={n} type="button" onClick={() => setDays(n)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${days === n ? 'bg-cacau text-white' : 'bg-white shadow-card'}`}>
            {n === 1 ? 'Hoje' : `${n} dias`}
          </button>
        ))}
      </div>
      {!d ? (
        <Card title="Funil">Carregando…</Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Pessoas na abertura" value={top} />
            <Stat label="Leads (contato)" value={d.leads} />
            <Stat label="Compras aprovadas" value={d.paid} />
          </div>
          <Card title="Onde as pessoas saem" hint="Pessoas únicas que chegaram em cada tela.">
            <div className="space-y-1.5">
              {rows.map((r, i) => {
                const prev = i > 0 ? rows[i - 1].n : r.n;
                const drop = prev > 0 && i > 0 ? Math.round((1 - r.n / prev) * 100) : 0;
                return (
                  <div key={r.name} className="flex items-center gap-2 text-sm">
                    <span className="w-36 shrink-0 font-bold">{r.name}</span>
                    <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-areia">
                      <div className="h-full rounded-full bg-gradient-to-r from-coral to-roxo" style={{ width: `${(r.n / top) * 100}%` }} />
                    </div>
                    <span className="w-12 text-right font-extrabold tabular-nums">{r.n}</span>
                    <span className={`w-12 text-right text-xs font-bold tabular-nums ${drop > 30 ? 'text-red-600' : 'text-cacau/50'}`}>{i > 0 && prev > 0 ? `-${drop}%` : ''}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          {d.missingTeams.length > 0 && (
            <Card title="Times que pediram e não temos" hint="Suba o escudo na aba Times.">
              <ul className="text-sm font-bold">
                {d.missingTeams.map(([t, n]) => (
                  <li key={t}>
                    {t} — {n}x
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function ProofTab({ s, set }: { s: SiteSettings; set: (p: Partial<SiteSettings>) => void }) {
  const listEditor = (key: 'realLife' | 'whatsapp' | 'instagram', labels: readonly string[]) => {
    const list = s.proof[key];
    const update = (i: number, v: ProofImage | null) => {
      const next = [...list];
      while (next.length <= i) next.push({ url: '' });
      if (v) next[i] = v;
      else next[i] = { url: '' };
      set({ proof: { ...s.proof, [key]: next } });
    };
    return labels.map((label, i) => (
      <div key={i} className="rounded-2xl bg-areia/50 p-3">
        <Upload label={label} value={list[i]?.url ?? ''} folder={`prova-${key}`} onChange={(url) => update(i, { ...(list[i] ?? {}), url })} />
        <input className="input mt-2 !min-h-[40px] !text-sm" placeholder="Legenda (opcional)" value={list[i]?.caption ?? ''} onChange={(e) => update(i, { url: list[i]?.url ?? '', caption: e.target.value })} />
      </div>
    ));
  };
  const reviews = s.proof.reviews;
  const setReviews = (r: Review[]) => set({ proof: { ...s.proof, reviews: r } });
  return (
    <>
      <Card title="Avatares de clientes (ao lado da nota)" hint="Até 5 fotos pequenas.">
        {Array.from({ length: 5 }, (_, i) => (
          <Upload
            key={i}
            label={`Avatar ${i + 1}`}
            value={s.proof.avatars[i] ?? ''}
            folder="avatares"
            onChange={(v) => {
              const a = [...s.proof.avatars];
              a[i] = v;
              set({ proof: { ...s.proof, avatars: a.filter(Boolean) } });
            }}
          />
        ))}
      </Card>
      <Card title="Kit na vida real">{listEditor('realLife', proofSlots.realLife)}</Card>
      <Card title="Prints de WhatsApp">{listEditor('whatsapp', proofSlots.whatsapp)}</Card>
      <Card title="Prints do Instagram">{listEditor('instagram', proofSlots.instagram)}</Card>
      <Card title="Avaliações" hint="Só avaliações reais. Também aparecem na tela de carregamento do quiz.">
        {reviews.map((r, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-areia/50 p-3">
            <Grid>
              <Text label="Nome" value={r.name} onChange={(v) => setReviews(reviews.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
              <Text label="Cidade" value={r.city} onChange={(v) => setReviews(reviews.map((x, j) => (j === i ? { ...x, city: v } : x)))} />
              <Text label="Nome do pet" value={r.petName ?? ''} onChange={(v) => setReviews(reviews.map((x, j) => (j === i ? { ...x, petName: v } : x)))} />
              <Num label="Estrelas" value={r.stars} onChange={(v) => setReviews(reviews.map((x, j) => (j === i ? { ...x, stars: Math.max(1, Math.min(5, v)) } : x)))} />
            </Grid>
            <label className="block text-xs font-extrabold uppercase text-cacau/60">Texto</label>
            <textarea className="input min-h-[80px] py-2 !text-base" value={r.text} onChange={(e) => setReviews(reviews.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <Upload label="Foto do pet" value={r.photo ?? ''} folder="avaliacoes" onChange={(v) => setReviews(reviews.map((x, j) => (j === i ? { ...x, photo: v } : x)))} />
            <button type="button" className="text-sm font-bold text-red-600" onClick={() => setReviews(reviews.filter((_, j) => j !== i))}>
              Remover avaliação
            </button>
          </div>
        ))}
        <button type="button" className="btn-ghost w-full !min-h-[44px] !text-base" onClick={() => setReviews([...reviews, { name: '', city: '', text: '', stars: 5 }])}>
          + Adicionar avaliação
        </button>
      </Card>
    </>
  );
}

function TeamsTab({ s, set }: { s: SiteSettings; set: (p: Partial<SiteSettings>) => void }) {
  const teams = s.extraTeams;
  const upd = (i: number, p: Partial<ExtraTeam>) => set({ extraTeams: teams.map((t, j) => (j === i ? { ...t, ...p } : t)) });
  return (
    <Card
      title="Times extras e troca de escudo"
      hint={`Já temos ${TEAMS.length} times com escudo. Aqui você adiciona um time novo, ou troca o escudo de um existente usando o mesmo código (ex.: flamengo).`}
    >
      {teams.map((t, i) => (
        <div key={i} className="space-y-2 rounded-2xl bg-areia/50 p-3">
          <Grid>
            <Text label="Código (sem espaço)" value={t.id} onChange={(v) => upd(i, { id: v.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
            <Text label="Nome" value={t.name} onChange={(v) => upd(i, { name: v })} />
            <Text label="Apelidos (vírgula)" value={t.aliases ?? ''} onChange={(v) => upd(i, { aliases: v })} />
            <label className="block">
              <span className="text-xs font-extrabold uppercase text-cacau/60">Cores</span>
              <div className="mt-1 flex gap-2">
                <input type="color" value={t.primary || '#6F2A7A'} onChange={(e) => upd(i, { primary: e.target.value })} className="h-11 w-16 rounded-lg" />
                <input type="color" value={t.secondary || '#FFFFFF'} onChange={(e) => upd(i, { secondary: e.target.value })} className="h-11 w-16 rounded-lg" />
              </div>
            </label>
          </Grid>
          <Upload label="Escudo (PNG transparente)" value={t.crest} folder="times" onChange={(v) => upd(i, { crest: v })} />
          <button type="button" className="text-sm font-bold text-red-600" onClick={() => set({ extraTeams: teams.filter((_, j) => j !== i) })}>
            Remover
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost w-full !min-h-[44px] !text-base"
        onClick={() => set({ extraTeams: [...teams, { id: '', name: '', crest: '', primary: '#6F2A7A', secondary: '#FFFFFF', aliases: '' }] })}
      >
        + Adicionar time
      </button>
      <details className="text-sm">
        <summary className="cursor-pointer font-bold">Ver códigos dos times que já existem</summary>
        <p className="mt-2 leading-relaxed text-cacau/70">{TEAMS.map((t) => `${t.short} (${t.id})`).join(' · ')}</p>
      </details>
    </Card>
  );
}

/* ---------------- campos ---------------- */

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="mx-auto max-w-sm px-4 pt-16 text-center">
      <Logo size={120} />
      <h1 className="h-display mt-4 text-2xl">Painel do Clube</h1>
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr('');
          const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: pw }) });
          if (r.ok) onOk();
          else setErr((await r.json().catch(() => ({}))).error || 'Erro');
        }}
      >
        <input className="input" type="password" placeholder="Senha" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        <button className="btn-primary w-full" type="submit">
          Entrar
        </button>
        {err && <p className="text-sm font-bold text-red-600">{err}</p>}
      </form>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-cacau/65">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-display text-3xl font-semibold text-roxo">{value.toLocaleString('pt-BR')}</p>
      <p className="text-xs font-bold text-cacau/60">{label}</p>
    </div>
  );
}

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-cacau/60">{label}</span>
      <input className="input mt-1 !min-h-[44px] !text-base" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-cacau/60">{label}</span>
      <input className="input mt-1 !min-h-[44px] !text-base" type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Upload({ label, value, onChange, folder, pdf }: { label: string; value: string; onChange: (v: string) => void; folder: string; pdf?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <span className="text-xs font-extrabold uppercase text-cacau/60">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          pdf ? (
            <a href={value} target="_blank" rel="noreferrer" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-areia text-2xl">
              📄
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-areia object-cover" />
          )
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-linha text-xl">{pdf ? '📄' : '📷'}</span>
        )}
        <label className="btn-ghost !min-h-[44px] cursor-pointer !px-4 !text-sm">
          {busy ? 'Enviando…' : value ? 'Trocar' : 'Enviar'}
          <input
            type="file"
            accept={pdf ? 'application/pdf' : 'image/*'}
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setErr('');
              const fd = new FormData();
              fd.append('file', f);
              fd.append('folder', folder);
              const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
              const d = await r.json().catch(() => ({}));
              setBusy(false);
              if (r.ok) onChange(d.url);
              else setErr(d.error || 'Erro no envio');
            }}
          />
        </label>
        {value && (
          <button type="button" className="text-sm font-bold text-red-600" onClick={() => onChange('')}>
            Remover
          </button>
        )}
      </div>
      {err && <p className="mt-1 text-xs font-bold text-red-600">{err}</p>}
    </div>
  );
}
