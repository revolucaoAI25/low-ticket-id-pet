'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ProofImage, type Review, type SiteSettings, type ExtraTeam } from '@/config/site';
import { bonusItems } from '@/config/offer';
import { Logo } from '@/components/ui';
import { allPages } from '@/lib/docs/render';
import { TEAMS } from '@/lib/teams';
import { Modelos } from './Modelos';
import { DEMO_AVATARS, DEMO_INSTAGRAM, DEMO_REAL_LIFE, DEMO_REVIEWS, DEMO_WHATSAPP } from '@/config/demo-proof';

type Tab = 'funil' | 'pedidos' | 'modelos' | 'bumps' | 'oferta' | 'checkout' | 'rastreamento' | 'prova' | 'imagens' | 'bonus' | 'times' | 'contato';
const TABS: [Tab, string][] = [
  ['funil', 'Funil'],
  ['pedidos', 'Pedidos'],
  ['oferta', 'Oferta'],
  ['checkout', 'Checkouts'],
  ['rastreamento', 'Pixel e UTMs'],
  ['prova', 'Prova social'],
  ['imagens', 'Imagens e templates'],
  ['modelos', 'Conferir documentos'],
  ['bonus', 'PDFs dos bônus'],
  ['bumps', 'Order bumps'],
  ['times', 'Times'],
  ['contato', 'Suporte'],
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
    // Listas de prova social vazias: já mostram as imagens de exemplo para você ordenar ou remover (salve para manter).
    const st = d.settings as SiteSettings;
    const fill = (l: ProofImage[], demo: ProofImage[]) => (l.some((x) => x.url) ? l : demo);
    setS({
      ...st,
      proof: {
        ...st.proof,
        realLife: fill(st.proof.realLife, DEMO_REAL_LIFE),
        whatsapp: fill(st.proof.whatsapp, DEMO_WHATSAPP),
        instagram: fill(st.proof.instagram, DEMO_INSTAGRAM),
        reviews: st.proof.reviews.length ? st.proof.reviews : DEMO_REVIEWS,
        avatars: st.proof.avatars.length ? st.proof.avatars : DEMO_AVATARS,
      },
    });
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
      {s.proof.demo && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          Modo demonstração ligado: o site mostra avaliações de exemplo. Desligue em Prova social antes de anunciar.
        </p>
      )}
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
        {tab === 'pedidos' && <Orders />}
        {tab === 'modelos' && <Modelos settings={s} />}

        {tab === 'oferta' && (
          <>
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
          </>
        )}
        {tab === 'oferta' && (
          <>
          <Card
            title="Pop-up de saída"
            hint="Aparece uma vez por visita na página de oferta quando a pessoa tenta sair (mouse para fora da janela no computador, botão voltar no celular). Com os checkouts abaixo preenchidos, oferece o preço extra; sem eles, só lembra que o desconto está reservado."
          >
            <label className="flex items-center gap-3 font-bold">
              <input type="checkbox" className="h-5 w-5" checked={s.exitOffer.enabled} onChange={(e) => set({ exitOffer: { ...s.exitOffer, enabled: e.target.checked } })} />
              Mostrar o pop-up de saída
            </label>
            <Num label="Preço especial do pop-up (R$)" value={s.exitOffer.price} step={0.1} onChange={(v) => set({ exitOffer: { ...s.exitOffer, price: v } })} />
            <Text label="Checkout com o preço especial — Cachorro" value={s.exitOffer.checkout.cachorro} onChange={(v) => set({ exitOffer: { ...s.exitOffer, checkout: { ...s.exitOffer.checkout, cachorro: v } } })} />
            <Text label="Checkout com o preço especial — Gato" value={s.exitOffer.checkout.gato} onChange={(v) => set({ exitOffer: { ...s.exitOffer, checkout: { ...s.exitOffer.checkout, gato: v } } })} />
            <Text label="Checkout com o preço especial — Outros pets" value={s.exitOffer.checkout.outros} onChange={(v) => set({ exitOffer: { ...s.exitOffer, checkout: { ...s.exitOffer.checkout, outros: v } } })} />
          </Card>
          </>
        )}

        {tab === 'checkout' && (
          <>
            <Card title="Links de checkout (Kiwify)" hint="O quiz escolhe o link pela espécie. Pássaro, peixe, roedor e outros usam o de 'Outros pets'.">
              <Text label="Cachorro" value={s.checkout.cachorro} onChange={(v) => set({ checkout: { ...s.checkout, cachorro: v } })} placeholder="https://pay.kiwify.com.br/..." />
              <Text label="Gato" value={s.checkout.gato} onChange={(v) => set({ checkout: { ...s.checkout, gato: v } })} placeholder="https://pay.kiwify.com.br/..." />
              <Text label="Outros pets" value={s.checkout.outros} onChange={(v) => set({ checkout: { ...s.checkout, outros: v } })} placeholder="https://pay.kiwify.com.br/..." />
              <Text
                label="Pet adicional (produto separado, opcional)"
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
            <Card title="Kit de exemplo" hint="Foto do kit impresso com um pet de exemplo. Aparece na seção 'O que vem no kit' da página de oferta (opcional).">
              <Upload label="Foto do kit de exemplo" value={s.images.kitExample} folder="exemplo" onChange={(v) => set({ images: { ...s.images, kitExample: v } })} />
            </Card>
            <Card title="Capas dos bônus">
              {bonusItems.map((b) => (
                <Upload key={b.id} label={b.title.replace('{do}', 'do [pet]')} value={s.images[b.imageKey]} folder="bonus" onChange={(v) => set({ images: { ...s.images, [b.imageKey]: v } })} />
              ))}
            </Card>
            <Card
              title="Fundos prontos dos documentos"
              hint="Suba aqui a imagem do template de cada página (sem os dados escritos). Depois que as posições dos campos forem mapeadas no código, o site escreve foto, nome e dados por cima. Confira em 'Conferir documentos'."
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

        {tab === 'bumps' && (
          <Card
            title="Order bumps de conteúdo"
            hint="Quando o webhook da Kiwify trouxer um destes (no pedido do kit ou num pedido separado), o PDF vai por e-mail na hora e também entra no fim do PDF do kit. As palavras-chave precisam aparecer no nome do bump na Kiwify (sem acento, separadas por vírgula). O '+1 pet' é configurado na aba Checkouts."
          >
            {s.bumps.map((b, i) => (
              <div key={i} className="space-y-2 rounded-2xl bg-areia/50 p-3">
                <Grid>
                  <Text label="Nome (aparece no e-mail)" value={b.name} onChange={(v) => set({ bumps: s.bumps.map((x, j) => (j === i ? { ...x, name: v } : x)) })} />
                  <Text label="Palavras-chave" value={b.keywords} onChange={(v) => set({ bumps: s.bumps.map((x, j) => (j === i ? { ...x, keywords: v } : x)) })} />
                </Grid>
                <Upload pdf label="PDF do bump" value={b.file} folder="bumps" onChange={(v) => set({ bumps: s.bumps.map((x, j) => (j === i ? { ...x, file: v } : x)) })} />
                <button type="button" className="text-sm font-bold text-red-600" onClick={() => set({ bumps: s.bumps.filter((_, j) => j !== i) })}>
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost w-full !min-h-[44px] !text-base"
              onClick={() => set({ bumps: [...s.bumps, { id: `bump-${Date.now().toString(36)}`, name: '', keywords: '', file: '' }] })}
            >
              + Adicionar bump
            </button>
          </Card>
        )}

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

      {!['funil', 'pedidos', 'modelos'].includes(tab) && (
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

const STEP_NAMES = ['Abertura', 'Espécie', 'Nome', 'Sexo', 'Raça', 'Personalidade', 'Origem', 'Time', 'Tutores', 'Cidade', 'Endereço', 'Foto', 'Contato', 'Carregando'];

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
  const listEditor = (key: 'realLife' | 'whatsapp' | 'instagram') => (
    <ImageList items={s.proof[key]} folder={`prova-${key}`} onChange={(next) => set({ proof: { ...s.proof, [key]: next } })} tall={key === 'whatsapp'} />
  );
  const reviews = s.proof.reviews;
  const setReviews = (r: Review[]) => set({ proof: { ...s.proof, reviews: r } });
  return (
    <>
      <Card title="Modo demonstração" hint="Mostra 5 avaliações de exemplo (inventadas), avatares com iniciais e '1.287 tutores' enquanto você não tem prova social real. Só preenche o que estiver vazio.">
        <label className={`flex items-center gap-3 rounded-xl p-3 font-bold ${s.proof.demo ? 'bg-red-50 text-red-700' : 'bg-areia/60'}`}>
          <input type="checkbox" className="h-5 w-5" checked={s.proof.demo} onChange={(e) => set({ proof: { ...s.proof, demo: e.target.checked } })} />
          {s.proof.demo ? 'LIGADO: desligue antes de anunciar (avaliação inventada para cliente real é propaganda enganosa).' : 'Mostrar avaliações de demonstração'}
        </label>
      </Card>
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
      <Card title="Kit na vida real">{listEditor('realLife')}</Card>
      <Card title="Prints de WhatsApp">{listEditor('whatsapp')}</Card>
      <Card title="Prints do Instagram">{listEditor('instagram')}</Card>
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

interface OrderRow {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  paid_at: string;
  refunded_at: string | null;
  extra_pet_slots: number;
  access_token: string;
  pets: { id: string; data: { name?: string }; submitted_at: string | null; files: { url: string; kind: string }[] | null }[];
}

function Orders() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(async (term = '') => {
    const r = await fetch(`/api/admin/pedidos?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setRows(d.orders);
    else setMsg(d.error || 'Erro');
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (action: 'resend' | 'unlock', customerId: string) => {
    const r = await fetch('/api/admin/pedidos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, customerId }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? (action === 'resend' ? (d.ok ? 'E-mail reenviado.' : 'Não foi possível enviar (confira o Resend).') : 'Edição liberada: o cliente pode corrigir e gerar de novo pelo mesmo link.') : d.error || 'Erro');
    load(q);
  };
  return (
    <Card title="Pedidos pagos" hint="Busque pelo e-mail. 'Liberar edição' deixa o cliente corrigir os dados e gerar o kit de novo pelo mesmo link.">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <input className="input !min-h-[44px] !text-base" placeholder="E-mail do cliente" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary !min-h-[44px] !px-4 !text-base" type="submit">
          Buscar
        </button>
      </form>
      {msg && <p className="rounded-xl bg-areia p-2 text-sm font-bold">{msg}</p>}
      {!rows ? (
        <p>Carregando…</p>
      ) : !rows.length ? (
        <p className="text-sm text-cacau/60">Nenhum pedido.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {rows.map((o) => {
            const link = `${window.location.origin}/confirmar/${o.access_token}`;
            const pending = !o.pets.length || o.pets.some((p) => !p.submitted_at);
            return (
              <li key={o.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{o.email || '(sem e-mail)'}</b>
                  {o.refunded_at ? (
                    <span className="rounded-full bg-red-100 px-2 text-xs font-bold text-red-700">reembolsado</span>
                  ) : pending ? (
                    <span className="rounded-full bg-[#FFF1E0] px-2 text-xs font-bold text-[#9A3412]">aguardando dados</span>
                  ) : (
                    <span className="rounded-full bg-[#E6F4EA] px-2 text-xs font-bold text-verde">kit enviado</span>
                  )}
                  <span className="text-cacau/50">{new Date(o.paid_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-1 text-cacau/70">
                  Pets: {o.pets.map((p) => p.data?.name || 'sem nome').join(', ') || '—'} · vagas: {1 + o.extra_pet_slots}
                  {o.phone ? ` · ${o.phone}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 font-bold text-roxo">
                  <button type="button" onClick={() => act('resend', o.id)}>
                    Reenviar e-mail
                  </button>
                  <button type="button" onClick={() => act('unlock', o.id)}>
                    Liberar edição
                  </button>
                  <button type="button" onClick={() => navigator.clipboard.writeText(link).then(() => setMsg('Link copiado.'))}>
                    Copiar link
                  </button>
                  {o.pets.flatMap((p) => p.files ?? []).filter((f) => f.kind === 'kit-pdf').map((f) => (
                    <a key={f.url} href={f.url} target="_blank" rel="noreferrer">
                      Ver PDF
                    </a>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
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

/** Envia um arquivo direto para o Storage (URL assinada) e devolve a URL pública. */
async function uploadAsset(f: File, folder: string): Promise<string> {
  const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: f.name, type: f.type, folder }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Erro no envio');
  const up = await fetch(d.signedUrl, { method: 'PUT', headers: { 'content-type': f.type }, body: f });
  if (!up.ok) throw new Error('Erro ao enviar o arquivo');
  return d.url;
}

/** Grade de imagens: ver todas, mudar a ordem, remover e adicionar. */
function ImageList({ items, onChange, folder, tall }: { items: ProofImage[]; onChange: (l: ProofImage[]) => void; folder: string; tall?: boolean }) {
  const list = items.filter((x) => x.url);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div>
      <p className="text-sm text-cacau/65">{list.length} imagem(ns). A ordem aqui é a ordem no site. Lembre de clicar em Salvar.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((it, i) => (
          <div key={it.url + i} className="overflow-hidden rounded-2xl border border-linha bg-white">
            <div className={`relative ${tall ? 'aspect-[1/2]' : 'aspect-[4/3]'} bg-areia/50`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" loading="lazy" className="h-full w-full object-contain" />
              <span className="absolute left-2 top-2 rounded-full bg-cacau/80 px-2 text-xs font-extrabold text-white">{i + 1}</span>
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5">
              <button type="button" aria-label="Mover para trás" disabled={i === 0} onClick={() => move(i, -1)} className="h-9 w-9 rounded-lg bg-areia font-extrabold disabled:opacity-30">
                ←
              </button>
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="h-9 flex-1 rounded-lg text-sm font-bold text-red-600 active:bg-red-50">
                Remover
              </button>
              <button type="button" aria-label="Mover para frente" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="h-9 w-9 rounded-lg bg-areia font-extrabold disabled:opacity-30">
                →
              </button>
            </div>
          </div>
        ))}
        <label className={`flex ${tall ? 'aspect-[1/2]' : 'aspect-[4/3]'} cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-linha bg-white text-center text-sm font-bold text-roxo`}>
          {busy ? 'Enviando…' : '+ Adicionar imagens'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])];
              if (!files.length) return;
              setBusy(true);
              setErr('');
              const added: ProofImage[] = [];
              for (const f of files) {
                try {
                  added.push({ url: await uploadAsset(f, folder) });
                } catch (x) {
                  setErr((x as Error).message);
                }
              }
              setBusy(false);
              onChange([...list, ...added]);
            }}
          />
        </label>
      </div>
      {err && <p className="mt-2 text-sm font-bold text-red-600">{err}</p>}
    </div>
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
              const r = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ name: f.name, type: f.type, folder }),
              });
              const d = await r.json().catch(() => ({}));
              if (!r.ok) {
                setBusy(false);
                return setErr(d.error || 'Erro no envio');
              }
              const up = await fetch(d.signedUrl, { method: 'PUT', headers: { 'content-type': f.type }, body: f });
              setBusy(false);
              if (up.ok) onChange(d.url);
              else setErr('Erro ao enviar o arquivo');
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
