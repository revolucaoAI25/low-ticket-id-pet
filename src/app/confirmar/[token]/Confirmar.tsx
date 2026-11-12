'use client';

import {
  AlertTriangle,
  Check,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  IdCard,
  ImagePlus,
  Mail,
  MapPin,
  Palette,
  PawPrint,
  Phone,
  Plus,
  QrCode,
  Stethoscope,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '@/config/site';
import { DocImage } from '@/components/DocImage';
import { BreedPicker } from '@/components/quiz/BreedPicker';
import { PhotoPicker } from '@/components/quiz/PhotoPicker';
import { TeamPicker } from '@/components/quiz/TeamPicker';
import { Logo } from '@/components/ui';
import { buildDocContext } from '@/lib/doc-context';
import { buildPackage } from '@/lib/docs/package';
import { formatPhone } from '@/lib/format';
import { compressImage } from '@/lib/image';
import { FAVORITE_COLORS, PERSONALITIES, doPet, g, hasName, petName, type EmergencyContact, type PetData, type PetExtras, type Tutor } from '@/lib/pet';
import { quizStore } from '@/lib/quiz-store';
import { SPECIES, getSpecies } from '@/lib/species';
import { allTeams } from '@/lib/teams';
import { track } from '@/lib/tracking';
import type { ExtraKind } from '@/lib/natal/pacote';
import type { PackageFile } from '@/lib/docs/package';

interface FileLink {
  name: string;
  url: string;
  kind: string;
}
interface PetView {
  id: string;
  slug: string;
  data: PetData;
  files: FileLink[];
  submitted: boolean;
}
interface Order {
  paid: boolean;
  refunded?: boolean;
  customer?: { email: string | null; phone: string | null; name: string | null };
  petsAllowed?: number;
  pets?: PetView[];
  bonusLinks?: { label: string; url: string }[];
  /** Order bumps personalizados comprados (Kit Natal, Figurinhas). */
  extras?: { id: string; name: string; kind: ExtraKind }[];
}
interface Draft {
  id?: string;
  data: PetData;
}

const SRD = 'SRD (vira-lata)';

export function Confirmar({ token, settings }: { token: string; settings: SiteSettings }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [tab, setTab] = useState(0);
  const [agree, setAgree] = useState(false);
  const [phase, setPhase] = useState<{ step: string; pct: number } | null>(null);
  const [failed, setFailed] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/pedido?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      if (r.status === 404) return setError('Não encontramos esse pedido. Confira o link do e-mail.');
      if (!r.ok) return setError('Não foi possível carregar agora. Tente de novo em instantes.');
      const d: Order = await r.json();
      setOrder(d);
      if (d.paid) {
        const pending: Draft[] = (d.pets ?? []).filter((p) => !p.submitted).map((p) => ({ id: p.id, data: p.data }));
        if (!d.pets?.length) {
          // Comprou sem lead salvo: aproveita o quiz deste navegador, se houver.
          const local = quizStore.get().pet;
          pending.push({ data: local.name || local.species ? local : {} });
        }
        setDrafts(pending);
      }
    } catch {
      setError('Sem conexão. Tente de novo.');
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!order || order.paid || order.refunded) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [order, load]);

  const call = useCallback(
    async (payload: Record<string, unknown>) => {
      const r = await fetch('/api/pedido', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, ...payload }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `erro ${r.status}`);
      return d;
    },
    [token],
  );

  async function generate() {
    setFailed('');
    const total = drafts.length;
    try {
      for (const [i, d] of drafts.entries()) {
        const label = total > 1 ? ` (${i + 1}/${total})` : '';
        setPhase({ step: `Salvando os dados${label}…`, pct: 3 });
        const { pet } = (await call({ action: 'save', pet: d })) as { pet: PetView };
        const phone = pet.data.tutors?.find((t) => t.phone)?.phone || order?.customer?.phone || '';
        const ctx = buildDocContext({ pet: pet.data, settings, seed: pet.id, slug: pet.slug, phone });
        const kinds = [...new Set((order?.extras ?? []).map((x) => x.kind))];
        const span = kinds.length ? 50 : 70;
        const files: PackageFile[] = await buildPackage(ctx, (n, t) => setPhase({ step: `Gerando os documentos ${doPet(pet.data)}${label}…`, pct: 5 + Math.round((n / t) * span) }));
        if (kinds.length) {
          const { buildExtras } = await import('@/lib/natal/pacote');
          const what = kinds.length > 1 ? 'o Kit Natal e as figurinhas' : kinds[0] === 'natal' ? 'o Kit Natal' : 'as figurinhas';
          files.push(...(await buildExtras(pet.data, kinds, (n, t) => setPhase({ step: `Criando ${what} ${doPet(pet.data)}${label}…`, pct: 55 + Math.round((n / t) * 20) }))));
        }
        setPhase({ step: `Enviando os arquivos${label}…`, pct: 78 });
        const { urls } = (await call({ action: 'upload-urls', petId: pet.id, files: files.map((f) => f.name) })) as { urls: Record<string, { signedUrl: string; path: string }> };
        let sent = 0;
        for (const f of files) {
          const u = urls[f.name];
          const r = await fetch(u.signedUrl, { method: 'PUT', headers: { 'content-type': f.type, 'x-upsert': 'true' }, body: f.blob });
          if (!r.ok) throw new Error(`upload ${f.name} ${r.status}`);
          setPhase({ step: `Enviando os arquivos${label}…`, pct: 78 + Math.round((++sent / files.length) * 17) });
        }
        setPhase({ step: 'Mandando tudo pro seu e-mail…', pct: 97 });
        await call({ action: 'finish', petId: pet.id, files: files.map((f) => ({ name: f.label, path: urls[f.name].path, kind: f.kind })) });
      }
      track('KitGerado', { pets: total }, { pixel: false });
      setPhase(null);
      await load();
    } catch (e) {
      console.error(e);
      setPhase(null);
      setFailed('Algo deu errado ao gerar o kit. Seus dados estão salvos: é só tentar de novo. Se continuar, fale com o suporte.');
    }
  }

  /** Bump personalizado aprovado depois do kit (ou o pet já tinha o kit): gera só ele. */
  async function generateExtras(pet: PetView, kinds: ExtraKind[]) {
    setFailed('');
    try {
      const what = kinds.length > 1 ? 'o Kit Natal e as figurinhas' : kinds[0] === 'natal' ? 'o Kit Natal' : 'as figurinhas';
      setPhase({ step: `Criando ${what} ${doPet(pet.data)}…`, pct: 5 });
      const { buildExtras } = await import('@/lib/natal/pacote');
      const files = await buildExtras(pet.data, kinds, (n, t) => setPhase({ step: `Criando ${what} ${doPet(pet.data)}…`, pct: 5 + Math.round((n / t) * 70) }));
      setPhase({ step: 'Enviando os arquivos…', pct: 78 });
      const { urls } = (await call({ action: 'extra-upload-urls', petId: pet.id, files: files.map((f) => f.name) })) as { urls: Record<string, { signedUrl: string; path: string }> };
      let sent = 0;
      for (const f of files) {
        const r = await fetch(urls[f.name].signedUrl, { method: 'PUT', headers: { 'content-type': f.type, 'x-upsert': 'true' }, body: f.blob });
        if (!r.ok) throw new Error(`upload ${f.name} ${r.status}`);
        setPhase({ step: 'Enviando os arquivos…', pct: 78 + Math.round((++sent / files.length) * 17) });
      }
      setPhase({ step: 'Mandando pro seu e-mail…', pct: 97 });
      await call({ action: 'extra-finish', petId: pet.id, files: files.map((f) => ({ name: f.label, path: urls[f.name].path, kind: f.kind })) });
      track('ExtraGerado', { kinds: kinds.join(',') }, { pixel: false });
      setPhase(null);
      await load();
    } catch (e) {
      console.error(e);
      setPhase(null);
      setFailed('Algo deu errado ao gerar. Tente de novo. Se continuar, fale com o suporte.');
    }
  }

  if (error)
    return (
      <Shell>
        <p className="card mt-8 p-6 text-center font-bold">{error}</p>
      </Shell>
    );
  if (!order)
    return (
      <Shell>
        <div className="mx-auto mt-16 h-14 w-14 animate-spin rounded-full border-[6px] border-linha border-t-roxo" />
      </Shell>
    );
  if (!order.paid)
    return (
      <Shell>
        <div className="card mt-8 p-6 text-center">
          {order.refunded ? (
            <p className="font-bold">Este pedido foi reembolsado. Se foi um engano, fale com {settings.support.email}.</p>
          ) : (
            <>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[5px] border-linha border-t-roxo" />
              <h1 className="h-display mt-4 text-2xl">Aguardando a confirmação do pagamento</h1>
              <p className="mt-2 font-semibold text-cacau/70">Assim que confirmar, esta página libera sozinha.</p>
            </>
          )}
        </div>
      </Shell>
    );

  if (phase)
    return (
      <Shell>
        <div className="mt-10 text-center">
          <div className="mx-auto h-3 w-full overflow-hidden rounded-full bg-linha">
            <div className="h-full rounded-full bg-gradient-to-r from-coral to-roxo transition-[width] duration-300" style={{ width: `${phase.pct}%` }} />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-roxo">{phase.pct}%</p>
          <h1 className="h-display mt-2 text-2xl">{phase.step}</h1>
          <p className="mt-2 font-semibold text-cacau/65">Não feche esta página. Leva menos de um minuto.</p>
        </div>
      </Shell>
    );

  const done = (order.pets ?? []).filter((p) => p.submitted);
  const canAdd = (order.pets?.length ?? 0) + drafts.filter((d) => !d.id).length < (order.petsAllowed ?? 1);
  const email = order.customer?.email;

  return (
    <Shell>
      {done.length > 0 && <Done pets={done} email={email} bonusLinks={order.bonusLinks ?? []} extras={order.extras ?? []} onGenerate={generateExtras} />}
      {done.length > 0 && !drafts.length && failed && <p className="mt-3 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">{failed}</p>}

      {drafts.length > 0 && (
        <>
          <section className="pt-5 text-center">
            <span className="chip !bg-[#E6F4EA] !text-verde">
              <Check size={14} strokeWidth={3} /> Pagamento confirmado
            </span>
            <h1 className="h-display mt-3 text-[28px] leading-tight">Confira os dados e receba o kit</h1>
            <p className="mt-2 font-semibold text-cacau/70">É assim que tudo vai sair nos documentos. Complete o que quiser: quanto mais completo, mais bonito fica.</p>
          </section>
          <div className="mt-4 flex gap-3 rounded-2xl border-2 border-mel/60 bg-[#FFF6E5] p-4 text-[14px] font-semibold leading-snug">
            <AlertTriangle className="mt-0.5 shrink-0 text-[#B45309]" size={20} />
            <p>
              <b>Você preenche isso uma vez só.</b> Revise com calma: depois de gerar, os documentos são enviados e não dá para editar por aqui.
            </p>
          </div>

          {drafts.length > 1 && (
            <div className="mt-5 flex gap-2 rounded-full bg-white p-1 shadow-card">
              {drafts.map((d, i) => (
                <button key={i} type="button" onClick={() => setTab(i)} className={`flex-1 rounded-full px-3 py-2 text-sm font-bold ${i === tab ? 'bg-roxo text-white' : 'text-cacau/70'}`}>
                  {hasName(d.data) ? petName(d.data) : `Pet ${i + 1}`}
                </button>
              ))}
            </div>
          )}

          <PetForm
            key={tab}
            extras={order.extras ?? []}
            draft={drafts[Math.min(tab, drafts.length - 1)]}
            settings={settings}
            fallbackPhone={order.customer?.phone ?? ''}
            onChange={(data) => setDrafts((cur) => cur.map((d, i) => (i === Math.min(tab, cur.length - 1) ? { ...d, data } : d)))}
          />

          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setDrafts((cur) => [...cur, { data: {} }]);
                setTab(drafts.length);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-roxo/40 py-4 font-bold text-roxo"
            >
              <Plus size={18} strokeWidth={2.6} /> Você comprou +1 pet: preencher o próximo
            </button>
          )}

          <section className="card mt-8 p-5">
            <label className="flex cursor-pointer items-start gap-3 text-[15px] font-bold leading-snug">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#6F2A7A]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              Conferi tudo com atenção. Sei que depois de gerar o kit não dá para alterar os dados.
            </label>
            <button type="button" disabled={!agree} onClick={generate} className="btn-cta shine mt-4 disabled:opacity-50">
              <Mail size={20} /> Gerar meu kit e enviar pro e-mail
            </button>
            {email && <p className="mt-3 text-center text-sm font-bold text-cacau/60">Vamos enviar para {email}</p>}
            {failed && <p className="mt-3 rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-700">{failed}</p>}
          </section>
        </>
      )}

      {!drafts.length && canAdd && done.length > 0 && (
        <button type="button" onClick={() => setDrafts([{ data: {} }])} className="btn-primary mt-6 w-full">
          <Plus size={18} /> Montar o kit do próximo pet
        </button>
      )}

      <footer className="mt-12 text-center text-xs font-semibold leading-relaxed text-cacau/55">
        Dúvidas? {settings.support.email}
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
        <Logo size={92} priority />
      </div>
      {children}
    </div>
  );
}

/* ---------------- kit enviado ---------------- */

const PERSONAL_KINDS = new Set(['natal-arte', 'natal-pdf', 'natal-zip', 'figurinha', 'figurinhas-zip']);

function Done({
  pets,
  email,
  bonusLinks,
  extras,
  onGenerate,
}: {
  pets: PetView[];
  email?: string | null;
  bonusLinks: { label: string; url: string }[];
  extras: { id: string; name: string; kind: ExtraKind }[];
  onGenerate: (pet: PetView, kinds: ExtraKind[]) => void;
}) {
  const icon: Record<string, LucideIcon> = { 'kit-pdf': FileText, 'bonus-pdf': FileText, zip: ImagePlus, ficha: QrCode };
  const label: Record<string, string> = {
    'kit-pdf': 'Documentos para imprimir (PDF)',
    'bonus-pdf': 'Bônus: Kit Aniversário e Quem Cuida (PDF)',
    zip: 'Imagens soltas (.zip, opcional)',
    ficha: 'Identidade do QR Code',
  };
  return (
    <section className="anim-fade-up pt-5">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde text-white">
          <Check size={34} strokeWidth={3} />
        </div>
        <h1 className="h-display mt-4 text-[28px] leading-tight">Pronto! O kit chegou no seu e-mail</h1>
        <p className="mt-2 font-semibold text-cacau/70">
          {email ? `Enviamos tudo para ${email}. ` : ''}Não achou? Olhe o spam e a aba Promoções. Os arquivos também estão aqui:
        </p>
      </div>
      {pets.map((p) => (
        <div key={p.id} className="card mt-5 p-4">
          <p className="font-display text-lg font-semibold">Kit {doPet(p.data)}</p>
          <div className="mt-3 space-y-2">
            {p.files.filter((f) => !PERSONAL_KINDS.has(f.kind)).map((f) => {
              const I = icon[f.kind] ?? Download;
              return (
                <a key={f.url} href={f.url} target="_blank" rel="noreferrer" download className="flex items-center gap-3 rounded-2xl bg-areia/60 p-3 font-bold active:bg-areia">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-roxo">
                    <I size={20} />
                  </span>
                  <span className="flex-1">{label[f.kind] ?? f.name}</span>
                  <Download size={18} className="text-cacau/50" />
                </a>
              );
            })}
          </div>
          <Personal pet={p} extras={extras} onGenerate={onGenerate} />
        </div>
      ))}
      {bonusLinks.length > 0 && (
        <div className="card mt-5 p-4">
          <p className="font-display text-lg font-semibold">Guias em PDF</p>
          <div className="mt-3 space-y-2">
            {bonusLinks.map((b) => (
              <a key={b.url} href={b.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl bg-areia/60 p-3 font-bold active:bg-areia">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-roxo">
                  <FileText size={20} />
                </span>
                <span className="flex-1">{b.label.replace(/^Bônus: /, '')}</span>
                <Download size={18} className="text-cacau/50" />
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="mt-4 text-center text-sm font-semibold text-cacau/65">
        Dica: para o RG, a CNH e as carteirinhas, use papel fotográfico ou couchê e plastifique. A tag ossinho fica ótima num porta-tag de pet shop.
      </p>
    </section>
  );
}

/* ---------------- order bumps personalizados ---------------- */

async function shareFile(url: string, name: string) {
  try {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
  }
  window.open(url, '_blank');
}

export function Personal({ pet, extras, onGenerate }: { pet: PetView; extras: { id: string; name: string; kind: ExtraKind }[]; onGenerate: (pet: PetView, kinds: ExtraKind[]) => void }) {
  const [ios, setIos] = useState(false);
  useEffect(() => setIos(/iPhone|iPad|iPod/.test(navigator.userAgent)), []);
  const arts = pet.files.filter((f) => f.kind === 'natal-arte');
  const natalPdf = pet.files.find((f) => f.kind === 'natal-pdf');
  const natalZip = pet.files.find((f) => f.kind === 'natal-zip');
  const figs = pet.files.filter((f) => f.kind === 'figurinha');
  const figZip = pet.files.find((f) => f.kind === 'figurinhas-zip');
  const missing = extras.filter((x) => (x.kind === 'natal' ? !arts.length : !figs.length));
  const kinds = [...new Set(missing.map((x) => x.kind))];
  const row = 'flex items-center gap-3 rounded-2xl bg-areia/60 p-3 font-bold active:bg-areia';
  return (
    <>
      {kinds.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-coral bg-[#FFF6F0] p-4 text-center">
          <p className="font-display text-lg font-semibold">{missing.map((x) => x.name).join(' e ')}</p>
          <p className="mt-1 text-sm font-semibold text-cacau/70">Feito com a foto {doPet(pet.data)}. Fica pronto em segundos e também vai pro seu e-mail.</p>
          <button type="button" onClick={() => onGenerate(pet, kinds)} className="btn-cta shine mt-3">
            Gerar agora
          </button>
        </div>
      )}
      {arts.length > 0 && (
        <div className="mt-5">
          <p className="font-display text-lg font-semibold">🎄 Kit Natal e Ano Novo</p>
          <p className="text-[13px] font-semibold text-cacau/60">Toque numa arte para abrir. No celular, toque e segure para salvar ou compartilhar.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {arts.map((f) => (
              <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-areia/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} loading="lazy" className="aspect-[4/5] w-full object-contain" />
              </a>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {natalPdf && (
              <a href={natalPdf.url} target="_blank" rel="noreferrer" className={row}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-roxo">
                  <FileText size={20} />
                </span>
                <span className="flex-1">Cartões e etiquetas para imprimir (PDF)</span>
                <Download size={18} className="text-cacau/50" />
              </a>
            )}
            {natalZip && (
              <a href={natalZip.url} download className={row}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-roxo">
                  <ImagePlus size={20} />
                </span>
                <span className="flex-1">Todas as artes (.zip)</span>
                <Download size={18} className="text-cacau/50" />
              </a>
            )}
          </div>
        </div>
      )}
      {figs.length > 0 && (
        <div className="mt-5">
          <p className="font-display text-lg font-semibold">💬 Figurinhas para o WhatsApp</p>
          <p className="text-[13px] font-semibold leading-snug text-cacau/65">
            {ios
              ? 'No iPhone: toque e segure a figurinha e escolha "Salvar". Depois, no WhatsApp, abra uma conversa, toque no ícone de figurinha, em "Criar figurinha" e escolha a imagem.'
              : 'Toque na figurinha, escolha o WhatsApp e mande para você mesmo. Na conversa, toque nela e escolha "Adicionar aos favoritos". Pronto: ela fica nas suas figurinhas.'}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {figs.map((f, i) => (
              <button
                key={f.url}
                type="button"
                onClick={() => shareFile(f.url, `figurinha-${i + 1}.${f.url.split('.').pop()?.split('?')[0] || 'webp'}`)}
                className="aspect-square rounded-xl bg-[repeating-conic-gradient(#f1e7da_0_25%,#fbf6ef_0_50%)] bg-[length:16px_16px] p-1 active:scale-95"
                aria-label={`Enviar a figurinha ${f.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
          {figZip && (
            <a href={figZip.url} download className={`${row} mt-3`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-roxo">
                <ImagePlus size={20} />
              </span>
              <span className="flex-1">Todas as figurinhas (.zip, com instruções)</span>
              <Download size={18} className="text-cacau/50" />
            </a>
          )}
        </div>
      )}
    </>
  );
}

/* ---------------- formulário ---------------- */

function Card({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card mt-4 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7EEF8] text-roxo">
          <Icon size={20} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
          {hint && <p className="text-[13px] font-semibold text-cacau/60">{hint}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-cacau/55">
        {label}
        {optional && <span className="font-bold normal-case tracking-normal text-cacau/40"> (opcional)</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = 'input !min-h-[50px] !text-base';

function PetForm({
  draft,
  settings,
  fallbackPhone,
  onChange,
  extras = [],
}: {
  draft: Draft;
  settings: SiteSettings;
  fallbackPhone: string;
  onChange: (d: PetData) => void;
  extras?: { id: string; name: string; kind: ExtraKind }[];
}) {
  const d = draft.data;
  const ex: PetExtras = d.extras ?? {};
  const set = (patch: Partial<PetData>) => onChange({ ...d, ...patch });
  const setEx = (patch: Partial<PetExtras>) => onChange({ ...d, extras: { ...ex, ...patch } });
  const species = getSpecies(d.species);
  const teams = useMemo(() => allTeams(settings.extraTeams), [settings.extraTeams]);
  const [teamOpen, setTeamOpen] = useState(false);
  const tutors: Tutor[] = d.tutors?.length ? d.tutors : [{ name: '', phone: fallbackPhone }];
  const contacts: EmergencyContact[] = ex.contacts?.length ? ex.contacts : [{ name: '', phone: '', relation: '' }];
  const photos = ex.photos ?? [];
  const ctx = useMemo(() => buildDocContext({ pet: { ...d, tutors }, settings, seed: draft.id || 'confirmar', phone: fallbackPhone }), [d, tutors, settings, draft.id, fallbackPhone]);

  // Garante que o telefone do quiz já venha no primeiro tutor.
  useEffect(() => {
    if (!d.tutors?.length) set({ tutors });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Card icon={PawPrint} title="Foto e dados principais">
        <PhotoPicker value={d.photo} species={d.species} onChange={(photo) => set({ photo })} />
        <Field label="Nome">
          <input className={inputCls} value={d.name ?? ''} onChange={(e) => set({ name: e.target.value })} autoCapitalize="words" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Espécie">
            <select className={inputCls} value={d.species ?? ''} onChange={(e) => set({ species: (e.target.value || undefined) as PetData['species'] })}>
              <option value="">—</option>
              {SPECIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sexo">
            <select className={inputCls} value={d.sex ?? ''} onChange={(e) => set({ sex: (e.target.value || undefined) as PetData['sex'] })}>
              <option value="">—</option>
              <option value="macho">Macho</option>
              <option value="femea">Fêmea</option>
            </select>
          </Field>
        </div>
        <Field label="Raça">
          <div className="mb-2">
            <button
              type="button"
              onClick={() => set({ breed: d.breed === SRD ? '' : SRD })}
              className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold ${d.breed === SRD ? 'border-roxo bg-[#F7EEF8] text-roxo' : 'border-linha bg-white'}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${d.breed === SRD ? 'border-roxo bg-roxo text-white' : 'border-linha'}`}>
                {d.breed === SRD && <Check size={13} strokeWidth={3.5} />}
              </span>
              Sem raça definida (vira-lata)
            </button>
          </div>
          {d.breed !== SRD && <BreedPicker breeds={(species?.breeds ?? []).filter((b) => b !== SRD)} value={d.breed ?? ''} onChange={(v) => set({ breed: v })} />}
        </Field>
        <Field label="Personalidade">
          <select className={inputCls} value={d.personality ?? ''} onChange={(e) => set({ personality: (e.target.value || undefined) as PetData['personality'] })}>
            <option value="">—</option>
            {Object.entries(PERSONALITIES).map(([k, v]) => (
              <option key={k} value={k}>
                {g(d, v.m, v.f)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Certidão de">
            <select className={inputCls} value={d.origin ?? ''} onChange={(e) => set({ origin: (e.target.value || undefined) as PetData['origin'] })}>
              <option value="">—</option>
              <option value="nascimento">Nascimento</option>
              <option value="adocao">Adoção</option>
            </select>
          </Field>
          <Field label={d.origin === 'adocao' ? 'Data da adoção' : 'Nascimento'}>
            <input className={inputCls} type="date" max={new Date().toISOString().slice(0, 10)} value={d.date ?? ''} onChange={(e) => set({ date: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card icon={Trophy} title="Time do coração" hint="Para a carteirinha de torcedor.">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-areia/60 p-3">
          <span className="font-bold">{d.team?.none ? 'Não torce' : d.team?.name || 'Nenhum time escolhido'}</span>
          <button type="button" className="text-sm font-extrabold text-roxo" onClick={() => setTeamOpen((o) => !o)}>
            {teamOpen ? 'Fechar' : 'Trocar'}
          </button>
        </div>
        {teamOpen && (
          <TeamPicker
            teams={teams}
            value={d.team}
            onPick={(t) => {
              set({ team: t });
              setTeamOpen(false);
            }}
          />
        )}
      </Card>

      <Card icon={Users} title="Tutores" hint="O telefone aparece na identidade que abre pelo QR Code.">
        {tutors.map((t, i) => (
          <div key={i} className="relative space-y-2 rounded-2xl bg-areia/50 p-3">
            {tutors.length > 1 && (
              <button
                type="button"
                aria-label="Remover tutor"
                onClick={() => set({ tutors: tutors.filter((_, j) => j !== i) })}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-cacau/40"
              >
                <X size={18} />
              </button>
            )}
            <input
              className={inputCls}
              placeholder={`Nome do tutor ${i + 1}`}
              value={t.name}
              onChange={(e) => set({ tutors: tutors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
              autoCapitalize="words"
            />
            <input
              className={inputCls}
              type="tel"
              placeholder="WhatsApp (opcional)"
              value={formatPhone(t.phone)}
              onChange={(e) => set({ tutors: tutors.map((x, j) => (j === i ? { ...x, phone: e.target.value.replace(/\D/g, '').slice(0, 11) } : x)) })}
            />
          </div>
        ))}
        {tutors.length < 4 && (
          <button type="button" onClick={() => set({ tutors: [...tutors, { name: '' }] })} className="flex items-center gap-2 text-sm font-extrabold text-roxo">
            <Plus size={16} strokeWidth={2.8} /> Adicionar mais um tutor
          </button>
        )}
      </Card>

      <Card icon={MapPin} title="Endereço" hint="Vai na identidade do QR Code, pra quem encontrar saber onde ele mora.">
        <Field label="Cidade">
          <input className={inputCls} placeholder="Ex.: Belo Horizonte - MG" value={d.address?.city ?? ''} onChange={(e) => set({ address: { ...d.address, city: e.target.value } })} />
        </Field>
        <Field label="Rua e número" optional>
          <input className={inputCls} value={d.address?.street ?? ''} onChange={(e) => set({ address: { ...d.address, street: e.target.value } })} />
        </Field>
        <Field label="Bairro" optional>
          <input className={inputCls} value={d.address?.district ?? ''} onChange={(e) => set({ address: { ...d.address, district: e.target.value } })} />
        </Field>
      </Card>

      <Card icon={HeartPulse} title="Saúde" hint="Importante pra quem encontrar ou cuidar dele.">
        <Field label="Alergias" optional>
          <input className={inputCls} placeholder="Ex.: frango, dipirona" value={ex.allergies ?? ''} onChange={(e) => setEx({ allergies: e.target.value })} />
        </Field>
        <Field label="Remédios de uso contínuo" optional>
          <input className={inputCls} value={ex.medications ?? ''} onChange={(e) => setEx({ medications: e.target.value })} />
        </Field>
        <Field label="Cuidados especiais" optional>
          <input className={inputCls} placeholder="Ex.: cardiopata, não enxerga bem" value={ex.conditions ?? ''} onChange={(e) => setEx({ conditions: e.target.value })} />
        </Field>
      </Card>

      <Card icon={IdCard} title="Identificação">
        <Field label="Pelagem e sinais" optional>
          <input className={inputCls} placeholder="Ex.: caramelo com mancha branca no peito" value={ex.coat ?? ''} onChange={(e) => setEx({ coat: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Porte" optional>
            <select className={inputCls} value={ex.size ?? ''} onChange={(e) => setEx({ size: e.target.value })}>
              <option value="">—</option>
              <option>Mini</option>
              <option>Pequeno</option>
              <option>Médio</option>
              <option>Grande</option>
              <option>Gigante</option>
            </select>
          </Field>
          <Field label="Peso" optional>
            <input className={inputCls} placeholder="Ex.: 8 kg" value={ex.weight ?? ''} onChange={(e) => setEx({ weight: e.target.value })} />
          </Field>
        </div>
        <Field label="Nº do microchip" optional>
          <input className={inputCls} inputMode="numeric" value={ex.microchip ?? ''} onChange={(e) => setEx({ microchip: e.target.value })} />
        </Field>
        <Field label="Nº do RG Animal (SinPatinhas)" optional>
          <input className={inputCls} value={ex.rgAnimal ?? ''} onChange={(e) => setEx({ rgAnimal: e.target.value })} />
        </Field>
      </Card>

      <Card icon={Stethoscope} title="Veterinário">
        <Field label="Nome do(a) veterinário(a)" optional>
          <input className={inputCls} value={ex.vetName ?? ''} onChange={(e) => setEx({ vetName: e.target.value })} />
        </Field>
        <Field label="Clínica" optional>
          <input className={inputCls} value={ex.vetClinic ?? ''} onChange={(e) => setEx({ vetClinic: e.target.value })} />
        </Field>
        <Field label="Telefone da clínica" optional>
          <input className={inputCls} type="tel" value={formatPhone(ex.vetPhone)} onChange={(e) => setEx({ vetPhone: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
        </Field>
      </Card>

      <Card icon={Phone} title="Contatos de emergência" hint="Se não conseguirem falar com os tutores.">
        {contacts.map((c, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-areia/50 p-3">
            <input className={inputCls} placeholder="Nome" value={c.name} onChange={(e) => setEx({ contacts: contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputCls}
                type="tel"
                placeholder="Telefone"
                value={formatPhone(c.phone)}
                onChange={(e) => setEx({ contacts: contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value.replace(/\D/g, '').slice(0, 11) } : x)) })}
              />
              <input className={inputCls} placeholder="Parentesco" value={c.relation ?? ''} onChange={(e) => setEx({ contacts: contacts.map((x, j) => (j === i ? { ...x, relation: e.target.value } : x)) })} />
            </div>
          </div>
        ))}
        {contacts.length < 3 && (
          <button type="button" className="flex items-center gap-2 text-sm font-extrabold text-roxo" onClick={() => setEx({ contacts: [...contacts, { name: '', phone: '', relation: '' }] })}>
            <Plus size={16} strokeWidth={2.8} /> Adicionar contato
          </button>
        )}
      </Card>

      <Card icon={ClipboardList} title="Rotina" hint="Vai no Kit Quem Cuida (pet sitter, avós, hotel).">
        <Field label="Ração / comida" optional>
          <input className={inputCls} value={ex.food ?? ''} onChange={(e) => setEx({ food: e.target.value })} />
        </Field>
        <Field label="Horários e quantidade" optional>
          <input className={inputCls} placeholder="Ex.: 8h e 18h, 1 xícara" value={ex.feedingTimes ?? ''} onChange={(e) => setEx({ feedingTimes: e.target.value })} />
        </Field>
        <Field label="Passeios e brincadeiras" optional>
          <input className={inputCls} value={ex.walks ?? ''} onChange={(e) => setEx({ walks: e.target.value })} />
        </Field>
        <Field label="Manias e o que ama" optional>
          <input className={inputCls} value={ex.habits ?? ''} onChange={(e) => setEx({ habits: e.target.value })} />
        </Field>
        <Field label="O que não pode" optional>
          <input className={inputCls} value={ex.forbidden ?? ''} onChange={(e) => setEx({ forbidden: e.target.value })} />
        </Field>
      </Card>

      <Card
        icon={Palette}
        title="Para os bônus"
        hint={
          extras.length
            ? `A cor e as fotos entram no Kit Aniversário${extras.some((x) => x.kind === 'natal') ? ', no Kit Natal' : ''}${extras.some((x) => x.kind === 'figurinhas') ? ' e nas figurinhas (cada figurinha usa uma das fotos)' : ''}. Coloque fotos bem nítidas, com o rostinho dele.`
            : 'A cor e as fotos entram no Kit Aniversário.'
        }
      >
        <Field label="Cor favorita">
          <div className="flex flex-wrap gap-2.5">
            {FAVORITE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={c.label}
                onClick={() => setEx({ favoriteColor: c.hex })}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-4 text-white transition-transform active:scale-90 ${ex.favoriteColor === c.hex ? 'scale-110 border-cacau' : 'border-white shadow-card'}`}
                style={{ background: c.hex }}
              >
                {ex.favoriteColor === c.hex && <Check size={18} strokeWidth={3.5} />}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Mais fotos (até 3)" optional>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) =>
              photos[i] ? (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[i]} alt="" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Remover foto" onClick={() => setEx({ photos: photos.filter((_, j) => j !== i) })} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-cacau/80 text-white">
                    <X size={15} />
                  </button>
                </div>
              ) : i === photos.length ? (
                <label key={i} className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-coral bg-white text-roxo">
                  <ImagePlus size={24} />
                  <span className="text-[11px] font-bold text-cacau/60">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setEx({ photos: [...photos, await compressImage(f)] });
                    }}
                  />
                </label>
              ) : (
                <div key={i} className="aspect-square rounded-xl bg-areia/50" />
              ),
            )}
          </div>
        </Field>
      </Card>

      <section className="mt-8">
        <h2 className="h-display text-xl">Veja como vai ficar</h2>
        <p className="mt-1 text-sm font-semibold text-cacau/60">Atualiza enquanto você preenche.</p>
        <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {(
            [
              ['rg', 0, 'RG · frente'],
              ['rg', 1, 'RG · verso'],
              ['cnh', 0, 'CNH Pet'],
              ['tag', 0, 'Tag ossinho'],
              ['ficha', 0, 'Identidade do QR'],
            ] as const
          ).map(([doc, page, label]) => (
            <figure key={label} className="w-[78%] shrink-0 snap-center">
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white p-3 shadow-card">
                <DocImage doc={doc} page={page} ctx={ctx} scale={0.45} className={doc === 'ficha' ? 'h-full' : 'w-full'} format={doc === 'tag' ? 'png' : undefined} />
              </div>
              <figcaption className="mt-1 text-center text-xs font-bold text-cacau/60">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
