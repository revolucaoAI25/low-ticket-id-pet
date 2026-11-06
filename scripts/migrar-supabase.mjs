/**
 * Copia TUDO de um projeto Supabase para outro: tabelas e arquivos (fotos, PDFs, kits, imagens do painel).
 * Os links que apontavam para o projeto antigo são trocados pelos do novo.
 *
 * Antes: no projeto NOVO, rode supabase/schema.sql no SQL Editor.
 *
 * Uso (no seu computador, na pasta do projeto, depois de `npm install`):
 *   OLD_URL=https://antigo.supabase.co OLD_KEY=service_role_antiga \
 *   NEW_URL=https://novo.supabase.co   NEW_KEY=service_role_nova \
 *   node scripts/migrar-supabase.mjs
 *
 * Pode rodar de novo sem problema: ele sobrescreve o que já copiou.
 */
import { createClient } from '@supabase/supabase-js';

const { OLD_URL, OLD_KEY, NEW_URL, NEW_KEY } = process.env;
if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error('Faltam variáveis: OLD_URL, OLD_KEY, NEW_URL, NEW_KEY');
  process.exit(1);
}
const opt = { auth: { persistSession: false } };
const from = createClient(OLD_URL, OLD_KEY, opt);
const to = createClient(NEW_URL, NEW_KEY, opt);
const oldBase = OLD_URL.replace(/\/$/, '');
const newBase = NEW_URL.replace(/\/$/, '');

/** Troca os links do projeto antigo pelos do novo, em qualquer campo (inclusive JSON). */
const relink = (row) => JSON.parse(JSON.stringify(row).split(oldBase).join(newBase));

// Ordem respeita as ligações entre tabelas.
const TABLES = ['settings', 'customers', 'pets', 'orders', 'webhook_logs', 'funnel_events'];
const BUCKETS = ['pet-photos', 'site-assets', 'kits'];

async function copyTable(t) {
  let total = 0;
  for (let start = 0; ; start += 1000) {
    const { data, error } = await from.from(t).select('*').range(start, start + 999);
    if (error) throw new Error(`${t}: ${error.message}`);
    if (!data.length) break;
    const { error: e2 } = await to.from(t).upsert(data.map(relink));
    if (e2) throw new Error(`${t} (gravar): ${e2.message}`);
    total += data.length;
    if (data.length < 1000) break;
  }
  console.log(`tabela ${t}: ${total} linhas`);
}

async function listAll(bucket, prefix = '') {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await from.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) out.push(...(await listAll(bucket, path))); // pasta
      else out.push({ path, type: item.metadata?.mimetype });
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function copyBucket(b) {
  const files = await listAll(b);
  let n = 0;
  for (const f of files) {
    const { data, error } = await from.storage.from(b).download(f.path);
    if (error) {
      console.warn(`  pulei ${b}/${f.path}: ${error.message}`);
      continue;
    }
    const { error: e2 } = await to.storage.from(b).upload(f.path, data, { upsert: true, contentType: f.type || data.type });
    if (e2) console.warn(`  erro ao enviar ${b}/${f.path}: ${e2.message}`);
    else n++;
  }
  console.log(`arquivos ${b}: ${n} de ${files.length}`);
}

for (const b of BUCKETS) await copyBucket(b);
for (const t of TABLES) await copyTable(t);

console.log(`
Pronto! Agora, no SQL Editor do projeto NOVO, rode isto para os contadores continuarem de onde pararam:

select setval(pg_get_serial_sequence('webhook_logs','id'), coalesce(max(id),1)) from webhook_logs;
select setval(pg_get_serial_sequence('funnel_events','id'), coalesce(max(id),1)) from funnel_events;

Depois troque SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel e faça Redeploy.`);
