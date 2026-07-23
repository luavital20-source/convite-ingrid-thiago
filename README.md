# Convite — Ingrid & Thiago

Convite de casamento em página única, com lista de presentes e pagamento
no cartão via Mercado Pago (Checkout Pro).

```
index.html            → o convite (inclui a lista de presentes)
obrigado.html         → página de retorno após o pagamento
presentes/01..20.jpg  → fotos das cotas
api/_presentes.js     → tabela OFICIAL de preços (usada pelo servidor)
api/criar-pagamento.js→ cria a preferência no Mercado Pago
api/webhook.js        → recebe as notificações de pagamento
```

---

## Colocar no ar (Vercel)

### 1. Importar o repositório

Em [vercel.com/new](https://vercel.com/new), importe este repositório.
Não há build: é site estático + funções em `api/`. Pode aceitar tudo
como vem (Framework Preset: **Other**).

### 2. Configurar o Access Token — **único passo obrigatório**

No painel do Mercado Pago, em
[Suas integrações](https://www.mercadopago.com.br/developers/panel/app) →
sua aplicação → **Credenciais de produção**, copie o **Access Token**
(começa com `APP_USR-`).

Na Vercel, vá em **Settings → Environment Variables** e adicione:

| Nome | Valor | Ambientes |
|---|---|---|
| `MP_ACCESS_TOKEN` | `APP_USR-...` | Production, Preview, Development |

Depois **Deployments → Redeploy**, para a função enxergar a variável.

> Pronto. A partir daqui os botões **Cartão** já funcionam.

### 3. (Opcional, recomendado) Notificações de pagamento

Para receber aviso de cada pagamento:

1. No painel do Mercado Pago → sua aplicação → **Webhooks**, cadastre a URL:
   `https://SEU-DOMINIO.vercel.app/api/webhook`
   e marque o evento **Pagamentos**.
2. Copie a **chave secreta** que o Mercado Pago gera e adicione na Vercel:

| Nome | Valor |
|---|---|
| `MP_WEBHOOK_SECRET` | a chave secreta do webhook |

Sem essa variável o webhook continua funcionando, só não valida a
assinatura. Os pagamentos aparecem em **Vercel → Logs**.

---

## Como o pagamento funciona

1. O convidado toca em **Cartão** em uma cota.
2. O navegador chama `POST /api/criar-pagamento` mandando **só o `id`** da cota.
3. O servidor busca o preço em `api/_presentes.js`, cria a preferência no
   Mercado Pago e devolve a URL do checkout.
4. O convidado paga no ambiente do Mercado Pago e volta para `obrigado.html`.

**Por que o preço não vai pelo navegador:** se o valor fosse enviado pelo
front, daria para trocá-lo pelo DevTools e pagar R$ 1 numa cota de R$ 2.300.
O valor cobrado vem sempre de `api/_presentes.js`.

### Ao mudar um preço

Altere nos **dois** lugares:

- `api/_presentes.js` → valor realmente cobrado
- `index.html`, lista `PRESENTES` → valor exibido no card

---

## Testar antes de divulgar

Use as **credenciais de teste** (Access Token de teste, `TEST-...`) em
`MP_ACCESS_TOKEN` e pague com um
[cartão de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards)
— por exemplo Mastercard `5031 4332 1540 6351`, CVV `123`, validade `11/30`.
Para aprovar, use o nome do titular `APRO`.

Depois é só trocar pelo token de produção e fazer redeploy.

---

## Pix

Os botões **Pix** ainda estão desativados (aparecem esmaecidos). Há duas formas
de ligar:

- **Pix próprio:** preencher o campo `pix` de cada item na lista `PRESENTES`
  do `index.html` com o link de pagamento.
- **Pix pelo Mercado Pago:** já está pronto no servidor — `api/criar-pagamento.js`
  aceita `{ "id": 1, "metodo": "pix" }` e devolve um checkout só com Pix.
  Basta trocar o botão Pix do `index.html` para chamar a API como o de cartão.
