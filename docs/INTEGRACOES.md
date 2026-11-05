# Integrações: Kiwify, Utmify e Pixel da Meta

Troque `SEU-DOMINIO` pelo domínio final do site.

## Como as peças se conectam

```
Anúncio (Meta) ──UTMs──▶ Quiz ──▶ Oferta ──clique──▶ Checkout Kiwify (com nome, e-mail, telefone e UTMs)
                                                         │
                       ┌──────── webhook ────────────────┼──────────── webhook ───────┐
                       ▼                                 ▼                            ▼
          /api/webhooks/kiwify (libera o kit)   Página de obrigado → /obrigado     Utmify (atribuição)
```

- **Nosso site** dispara os eventos do funil no Pixel (cada tela do quiz, Lead, oferta, InitiateCheckout).
- **A Kiwify** dispara a **Purchase** (compra) no Pixel. Não disparamos Purchase no site para não contar duas vezes.
- **A Utmify** recebe as vendas por webhook da Kiwify e cruza com as UTMs.

## 1. Kiwify

### Produtos e checkouts
1. Crie o produto **Kit Identidade Pet** (R$ 19,90) e os **3 checkouts** (Cachorro, Gato, Outros pets), cada um com seus order bumps.
2. O order bump **"+1 pet no kit"** precisa ter no nome uma das palavras-chave configuradas em **/admin → Checkouts** (padrão: `pet adicional`, `+1 pet`, `mais 1 pet`, `pet extra`). É assim que o site sabe que precisa liberar mais uma vaga de pet.
3. Crie também um produto/checkout **"Pet adicional"** (R$ 9,90), com uma dessas palavras no nome, e cole o link em **/admin → Checkouts → Pet adicional**. Ele aparece na área do pet para quem tem mais de dois pets.
4. Cole os 3 links em **/admin → Checkouts**.

### Página de obrigado
Em cada produto: **Configurações → Página de obrigado personalizada** → `https://SEU-DOMINIO/obrigado`.

### Webhook (libera o kit)
1. **Apps → Webhooks → Criar webhook**.
2. URL: `https://SEU-DOMINIO/api/webhooks/kiwify`
3. Produtos: o Kit e o Pet adicional.
4. Eventos: **Compra aprovada**, **Reembolso** e **Chargeback**.
5. Copie o **token** que a Kiwify mostra e coloque na Vercel como `KIWIFY_WEBHOOK_TOKEN` (depois faça *Redeploy*).

Como a compra é ligada ao quiz: pelo **e-mail** da compra (e, se não achar, pelo **telefone**). Por isso o checkout já abre com o e-mail e o telefone do quiz preenchidos. Quem comprar com outro e-mail recebe o acesso mesmo assim e cadastra o pet na área.

### Pixel na Kiwify (Purchase)
Em cada produto: **Configurações → Pixel** → Facebook → cole o **mesmo ID de Pixel** e, se puder, o **token da API de Conversões**. Assim a Kiwify envia a Purchase.

### ✅ Teste antes de anunciar
Faça uma compra real de teste (Pix) e confira:
- o checkout abriu com nome, e-mail e telefone preenchidos (se não preencher, ajuste os nomes dos parâmetros em **/admin → Checkouts**);
- a página `/obrigado` abriu o kit sozinha;
- o pedido aparece no Supabase (tabela `orders`) e a tabela `webhook_logs` mostra o que a Kiwify mandou;
- o "+1 pet" liberou a segunda vaga (se comprou o bump).

Depois, reembolse.

## 2. Utmify

1. **Integrações → Kiwify** na Utmify: ela gera uma URL de webhook. Cole essa URL na Kiwify (**Apps → Webhooks**, um webhook separado do nosso), com os eventos de venda (aprovada, recusada, reembolso, chargeback, Pix gerado). Os dois webhooks convivem.
2. **Script de UTMs**: já vem no site (ligado em **/admin → Pixel e UTMs**). Além dele, o próprio site guarda as UTMs da primeira visita e repassa para o link da Kiwify, porque o link é montado só no fim do quiz.
3. **Parâmetros nos anúncios**: no Gerenciador de Anúncios, em *Parâmetros de URL*, use o modelo que a Utmify fornece no painel dela (utm_source, utm_campaign, utm_medium, utm_content e utm_term com nome e ID de campanha, conjunto e anúncio).
4. **Pixel da Utmify** (opcional): se preferir que a Utmify cuide do pixel, coloque o ID dela em **/admin → Pixel e UTMs** e **deixe o Pixel da Meta vazio** (os dois juntos contam em dobro).

## 3. Pixel da Meta

Cole o ID em **/admin → Pixel e UTMs**. Eventos que o site dispara:

| Momento | Evento | Tipo |
|---|---|---|
| Qualquer página | `PageView` | padrão |
| Abertura do quiz | `ViewContent` | padrão |
| Cada tela do quiz | `QuizEtapa` (`etapa`, `tela`) | personalizado |
| Enviou o contato | `Lead` + correspondência avançada (e-mail e telefone) | padrão |
| Viu a oferta | `ViewContent` (valor 19,90) + `VerOferta` | padrão + personalizado |
| Clicou em comprar | `InitiateCheckout` (valor 19,90 BRL) | padrão |
| Compra | `Purchase` | **disparado pela Kiwify** |

Para ver onde as pessoas saem, use **/admin → Funil** (cada etapa, pessoas únicas e a queda em %). No Gerenciador de Eventos da Meta dá para criar conversões personalizadas com `QuizEtapa` filtrando por `etapa`.

## 4. E-mail de acesso (opcional, recomendado)

Crie uma conta na **Resend**, verifique o domínio e coloque `RESEND_API_KEY` e `EMAIL_FROM` na Vercel. Sem isso, o acesso funciona pela página de obrigado e o e-mail da própria Kiwify continua chegando.
