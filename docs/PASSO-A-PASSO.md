# Passo a passo para colocar no ar

Ordem recomendada. Troque `SEU-DOMINIO` pelo domínio final (ex.: `clubedofocinho.com.br`).

## 1. Supabase (banco de dados e arquivos)

1. Crie um projeto em supabase.com (região São Paulo, se disponível).
2. Menu **SQL Editor → New query** → cole todo o arquivo `supabase/schema.sql` → **Run**.
   Isso cria as tabelas e os 3 buckets de arquivos (`pet-photos`, `site-assets`, `kits`).
3. Menu **Project Settings → API**, anote:
   - **Project URL** → vai em `SUPABASE_URL`
   - **service_role key** (em painéis novos aparece como **secret key**) → vai em `SUPABASE_SERVICE_ROLE_KEY`.
     Essa chave é secreta: só na Vercel, nunca em lugar público.

## 2. Resend (envio do kit por e-mail) — obrigatório

1. Crie a conta em resend.com.
2. **Domains → Add domain** → informe o seu domínio e adicione no DNS os registros que a Resend mostrar. Espere ficar "Verified".
3. **API Keys → Create API key** → anote → vai em `RESEND_API_KEY`.
4. Escolha o remetente, por exemplo `Clube do Focinho <kit@SEU-DOMINIO>` → vai em `EMAIL_FROM`.

## 3. Vercel (hospedagem)

1. **Add New → Project** → importe o repositório `low-ticket-id-pet`.
2. Em **Environment Variables**, cadastre:

| Variável | O que colocar |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://SEU-DOMINIO` (sem barra no final) |
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key do Supabase |
| `ADMIN_PASSWORD` | uma senha forte, criada por você, para entrar em `/admin` |
| `KIWIFY_WEBHOOK_TOKEN` | o token do webhook da Kiwify (passo 4). Mais de um webhook: todos separados por vírgula. |
| `RESEND_API_KEY` | chave da Resend |
| `EMAIL_FROM` | ex.: `Clube do Focinho <kit@SEU-DOMINIO>` |
| `UTMIFY_API_TOKEN` | Utmify → Integrações → Credenciais de API → criar credencial. Manda os order bumps e o +1 pet para a Utmify, com as UTMs. |
| `UTMIFY_TEST` | opcional: `1` faz a Utmify só validar, sem salvar. Apague depois do teste. |
| `META_CAPI_TOKEN` | opcional: token da API de Conversões da Meta. Só use se a Utmify não repassar à Meta a compra dos bumps (senão conta em dobro). |
| `META_TEST_EVENT_CODE` | opcional, só durante o teste (aba Testar eventos). Apague depois. |

3. **Deploy**.
4. **Settings → Domains** → adicione o domínio. Se ainda não comprou, compre por ali mesmo.
5. Sempre que mudar uma variável: **Deployments → … → Redeploy**.

> O ID do Pixel, os links de checkout e tudo de conteúdo **não** vão na Vercel: vão no painel `/admin`.

## 4. Kiwify

Para cada um dos 3 produtos/checkouts (Cachorro, Gato, Outros pets):

1. **Página de obrigado personalizada**: `https://SEU-DOMINIO/obrigado`
2. **Pixel**: Facebook → ID do Pixel + token da API de Conversões (é a Kiwify que dispara a compra).
3. **Order bumps**: o nome de cada bump precisa conter a palavra-chave cadastrada no `/admin → Order bumps`
   (ex.: "Xixi no Lugar Certo em 7 Dias" contém `xixi no lugar certo`). O "+1 pet" precisa conter `pet adicional` ou `+1 pet`.

Webhook (uma vez só):

1. **Apps → Webhooks → Criar webhook**
2. URL: `https://SEU-DOMINIO/api/webhooks/kiwify`
3. Produtos: o kit, os 3 bumps e o +1 pet (dá para marcar todos num webhook só; se fizer um por produto, a URL é a mesma).
4. Eventos: **Compra aprovada**, **Reembolso**, **Chargeback**.
5. Copie o token → coloque em `KIWIFY_WEBHOOK_TOKEN` na Vercel → Redeploy. Com vários webhooks, junte os tokens com vírgula: `token1,token2,token3`.

## 5. Painel `/admin` (entre com a `ADMIN_PASSWORD`)

| Aba | O que preencher |
|---|---|
| **Checkouts** | Os 3 links da Kiwify (Cachorro, Gato, Outros pets). |
| **Pixel e UTMs** | ID do Pixel da Meta. Deixe ligado o script de UTMs da Utmify. Deixe vazio o "Pixel da Utmify". |
| **Oferta** | Preço, preço "De", timer, nota e nº de tutores (0 = esconde). Pop-up de saída: preço especial e os checkouts com esse preço (sem eles, o pop-up só lembra que o desconto está reservado). |
| **Order bumps** | Suba o PDF de cada bump. Confira as palavras-chave. |
| **PDFs dos bônus** | Calendário de Saúde (cão, gato e outros) e Guia de Viagem. |
| **Imagens e templates** | Imagem da abertura (opcional), foto do kit de exemplo (opcional), capas dos bônus (opcional: sem elas o site usa capas próprias) e os templates dos documentos. |
| **Prova social** | Avatares, fotos do kit na vida real, prints e avaliações (só reais). |
| **Suporte** | E-mail, WhatsApp, horário, nome da empresa e CNPJ. |
| **Conferir documentos** | Veja como os documentos estão saindo. |
| **Pedidos** | Suporte: reenviar e-mail, liberar nova edição, copiar link. |
| **Funil** | Quantas pessoas chegam em cada tela. |

Lembre de clicar em **Salvar** no rodapé.

## 6. Utmify

1. Na Utmify: **Integrações → Kiwify** → copie a URL de webhook que ela gera.
2. Na Kiwify: **Apps → Webhooks → Criar webhook** (outro, separado do nosso) → cole a URL da Utmify → eventos de venda.
3. Nos anúncios da Meta, em **Parâmetros de URL**, cole o modelo de UTMs que a Utmify mostra no painel dela.
4. **Integrações → Credenciais de API → criar credencial** → copie o token → `UTMIFY_API_TOKEN` na Vercel → Redeploy.
   Os order bumps e o +1 pet são pedidos à parte na Kiwify; o nosso webhook repassa cada um (e seus reembolsos) para a Utmify por essa API.

## 7. Teste antes de anunciar

1. Faça o quiz no celular até o fim e clique em comprar: o checkout deve abrir com e-mail e telefone preenchidos.
2. Pague com Pix (valor real) usando um bump.
3. A página de obrigado deve levar para a confirmação; confirme os dados e gere o kit.
4. Confira no e-mail: o PDF único anexado, o bump anexado no e-mail de pagamento e os links.
5. Imprima a tag e escaneie o QR Code com o celular.
6. Reembolse pela Kiwify.
