# Clube do Focinho · Kit Identidade Pet

Funil de quiz que vende o Kit Identidade Pet (R$ 19,90): o anúncio cai direto no quiz, a pessoa "preenche" o documento do pet, vê a prévia do RG com foto e nome e recebe a oferta. Depois da compra, a área do pet libera os documentos prontos, sem preencher nada de novo.

**Stack:** Next.js 15 (App Router) na Vercel · Supabase (banco + fotos) · Resend (e-mail de acesso, opcional) · documentos gerados no navegador por template (Canvas → PNG/PDF), sem IA.

## Páginas

| Rota | O que é |
|---|---|
| `/` | Abertura + quiz (13 telas). Nada trava: tudo tem "Pular". Respostas salvas no navegador. |
| `/resultado` | Resultado e oferta (16 seções), barra fixa de compra, timer. |
| `/obrigado` | Página de obrigado da Kiwify. Espera o webhook e abre o kit sozinha. |
| `/kit/[token]` | Área do pet (link mágico): downloads, completar dados, Modo Perdido, +1 pet. |
| `/p/[código]` | Página pública do QR Code (ex.: `/p/exemplo`). |
| `/admin` | Painel: checkouts, preço, timer, pixel, prova social, imagens, PDFs, times, funil. |
| `/modelos` | Conferência de todos os documentos com um pet de exemplo. |
| `/privacidade`, `/termos` | Políticas. |

## Colocar no ar (uma vez)

1. **Supabase** → crie um projeto → *SQL Editor* → cole `supabase/schema.sql` → *Run*. Isso cria as tabelas e os buckets `pet-photos` e `site-assets`.
2. **Vercel** → *Add New Project* → importe este repositório → em *Environment Variables* coloque as variáveis de `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` (o domínio final, ex.: `https://clubedofocinho.com.br`)
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
   - `ADMIN_PASSWORD` (senha do `/admin`)
   - `KIWIFY_WEBHOOK_TOKEN` (depois de criar o webhook na Kiwify)
   - `RESEND_API_KEY` e `EMAIL_FROM` (opcional, para o e-mail de acesso)
3. **Domínio** → Vercel → *Settings → Domains*. Depois de trocar o domínio, atualize `NEXT_PUBLIC_SITE_URL` e faça *Redeploy* (o QR Code usa esse endereço).
4. Entre em `/admin` e preencha os checkouts, o pixel e o suporte.
5. Siga **[docs/INTEGRACOES.md](docs/INTEGRACOES.md)** para Kiwify, Utmify e Pixel da Meta.

## O que trocar sem mexer no código (painel `/admin`)

Links dos 3 checkouts + pet adicional · preço e ancoragem · timer · nota e nº de tutores · Pixel da Meta e Utmify · avatares, fotos do kit na vida real, prints de WhatsApp e Instagram, avaliações · imagem da abertura · capas dos bônus · fundos prontos dos documentos · PDFs dos bônus · times extras e escudos · suporte e dados da empresa. A aba **Funil** mostra quantas pessoas chegaram em cada tela.

Prova social começa como espaço reservado (caixa tracejada com a etiqueta do que vai ali). Nenhum depoimento inventado.

## Onde mexer no código

| O quê | Arquivo |
|---|---|
| Cores, logo | `src/config/brand.ts` (+ variáveis em `src/app/globals.css`) |
| Fontes | `src/app/fonts.ts` |
| Itens do kit, bônus e valores de ancoragem | `src/config/offer.ts` |
| Padrões do painel | `src/config/site.ts` |
| Telas do quiz | `src/components/quiz/Quiz.tsx` |
| Página de oferta | `src/components/offer/Offer.tsx` |
| Espécies, raças, vacinas | `src/lib/species.ts` |
| Times (40 com escudo em `public/teams`) | `src/lib/teams.ts` |
| Desenho de cada documento | `src/lib/docs/templates/*.ts` |

### Templates dos documentos

Cada página de documento tem um id (ex.: `rg-frente`, `certidao`, `tag-redonda`). Hoje os fundos são desenhados em código. Quando a IA de imagens entregar os modelos, suba o fundo de cada página em **/admin → Imagens → Fundos prontos** (no tamanho indicado). O código continua escrevendo foto, nome e campos por cima; se o layout novo mudar as posições, ajuste as coordenadas no arquivo do template e confira em `/modelos`.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha
npm run dev                  # http://localhost:3000
```

Sem Supabase o quiz e a oferta funcionam (o lead só não é salvo).
