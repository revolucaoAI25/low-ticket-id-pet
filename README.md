# Clube do Focinho · Kit Identidade Pet

Funil de quiz que vende o Kit Identidade Pet (R$ 19,90): o anúncio cai direto no quiz, a pessoa "preenche" o documento do pet, vê a prévia do RG com foto e nome e recebe a oferta. Depois da compra, ela confere os dados **uma única vez** e recebe tudo no e-mail num **PDF só**: capa, instruções de montagem, documentos (A4, tamanho real, linha de corte), bônus personalizados, bônus em PDF e os order bumps comprados. Vai também um ZIP opcional com as imagens soltas e a identidade do pet que abre pelo QR Code da tag.

**Stack:** Next.js 15 (App Router) na Vercel · Supabase (banco + fotos) · Resend (e-mail de acesso, opcional) · documentos gerados no navegador por template (Canvas → PNG/PDF), sem IA.

## Páginas

| Rota | O que é |
|---|---|
| `/` | Abertura + quiz. Nada trava: tudo tem "Pular". Respostas salvas no navegador. |
| `/resultado` | Resultado e oferta, barra fixa de compra, timer. |
| `/obrigado` | Página de obrigado da Kiwify. Espera o webhook e leva para a confirmação. |
| `/confirmar/[link]` | Confirmação única: confere os dados, completa saúde/veterinário/contatos/cor favorita/fotos extras, gera o kit e envia por e-mail. Depois disso mostra só os downloads. |
| `/q/[código]` | Link curto do QR Code da tag: redireciona para a imagem estática da identidade do pet (sem página, sem Modo Perdido). |
| `/admin` | Painel: pedidos (reenviar e-mail, liberar edição), checkouts, preço, pixel, prova social, templates, conferência dos documentos, PDFs, times, funil. |
| `/privacidade`, `/termos` | Políticas. |

## Colocar no ar (uma vez)

1. **Supabase** → crie um projeto → *SQL Editor* → cole `supabase/schema.sql` → *Run*. Isso cria as tabelas e os buckets `pet-photos` e `site-assets`.
2. **Vercel** → *Add New Project* → importe este repositório → em *Environment Variables* coloque as variáveis de `.env.example`:
   - `NEXT_PUBLIC_SITE_URL` (o domínio final, ex.: `https://clubedofocinho.com.br`)
   - `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
   - `ADMIN_PASSWORD` (senha do `/admin`)
   - `KIWIFY_WEBHOOK_TOKEN` (depois de criar o webhook na Kiwify)
   - `RESEND_API_KEY` e `EMAIL_FROM` (**necessário**: é por e-mail que o kit é entregue)
3. **Domínio** → Vercel → *Settings → Domains*. Depois de trocar o domínio, atualize `NEXT_PUBLIC_SITE_URL` e faça *Redeploy* (o QR Code usa esse endereço).
4. Entre em `/admin` e preencha os checkouts, o pixel e o suporte.
5. Siga **[docs/PASSO-A-PASSO.md](docs/PASSO-A-PASSO.md)** (todas as chaves e o que preencher no painel) e **[docs/INTEGRACOES.md](docs/INTEGRACOES.md)** (como as integrações conversam).

## O que trocar sem mexer no código (painel `/admin`)

Pedidos (reenviar e-mail, liberar edição, copiar link) · links dos 3 checkouts · preço e ancoragem · timer · nota e nº de tutores · Pixel da Meta e Utmify · avatares, fotos do kit na vida real, prints de WhatsApp e Instagram, avaliações · imagem da abertura · capas dos bônus · fundos prontos dos documentos · PDFs dos bônus · order bumps (PDF entregue por e-mail e no kit) · times extras e escudos · suporte e dados da empresa. A aba **Funil** mostra quantas pessoas chegaram em cada tela.

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

### Templates dos documentos (imagens prontas + mapeamento de campos)

Os documentos são **imagens de template** com os dados escritos por cima pelo código:

1. Suba a imagem de cada página em **/admin → Imagens e templates** (ou coloque em `public/templates/<id>.png` e aponte em `template:` no arquivo do documento).
2. Mapeie os campos em `slots` no arquivo do documento (`src/lib/docs/templates/*.ts`): cada campo tem posição em fração da página (0 a 1), tamanho, cor e alinhamento. A lista de campos disponíveis (nome, raça, tutores, registro, QR, foto…) está em `src/lib/docs/layout.ts` e também em **/admin → Conferir documentos**.
3. Confira em **/admin → Conferir documentos**.

Enquanto uma página não tem template + campos mapeados, ela usa o desenho provisório em código.

| Documento | ids das páginas |
|---|---|
| RG do Pet | `rg-frente`, `rg-verso` |
| CNH Pet | `cnh-frente`, `cnh-verso` |
| Certidão | `certidao` |
| Passaporte (88 × 125 mm, livreto de 8 páginas; capa = imagem em `public/templates/passaporte-capa.webp`) | `passaporte-capa`, `passaporte-miolo-1`, `passaporte-miolo-2` |
| Tag ossinho | `tag-nome`, `tag-qr` |
| Identidade (QR) | `ficha` |
| Vacinação (dobrável, rosa ou azul, montada em código) | `vacina-fora`, `vacina-dentro` |
| Torcedor (montada em código com o time, sem template) | `torcedor-frente`, `torcedor-verso` |
| Capa e instruções (início do PDF) | `guia-capa`, `guia-instrucoes` |
| Bônus Aniversário | `aniv-convite`, `aniv-topo`, `aniv-plaquinhas`, `aniv-certificado` |
| Bônus Quem Cuida | `quemcuida` |

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha
npm run dev                  # http://localhost:3000
```

Sem Supabase o quiz e a oferta funcionam (o lead só não é salvo). Com `DEMO_PROOF=1` (ou o "Modo demonstração" do painel), o site mostra avaliações de exemplo — só para mockup; desligue antes de anunciar. Se já rodou uma versão anterior do `schema.sql`, rode de novo: ele só acrescenta o que falta.
