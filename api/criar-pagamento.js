/**
 * POST /api/criar-pagamento
 *
 * Cria uma preferência de pagamento no Mercado Pago (Checkout Pro) e
 * devolve a URL do checkout para o navegador redirecionar.
 *
 * Entrada  : { "id": 12, "metodo": "cartao" }   // metodo é opcional
 * Saída    : { "init_point": "https://...", "preference_id": "..." }
 *
 * Única configuração necessária na Vercel:
 *   MP_ACCESS_TOKEN = APP_USR-...   (Access Token de produção)
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/reference/preferences
 */

const { buscarPresente } = require('./_presentes.js');

const MP_API = 'https://api.mercadopago.com/checkout/preferences';

/** Monta a URL pública do site a partir dos cabeçalhos da requisição. */
function origemDe(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error('[pagamento] MP_ACCESS_TOKEN ausente nas variáveis de ambiente.');
    return res.status(500).json({ erro: 'Pagamento ainda não configurado.' });
  }

  // O corpo pode vir como objeto (Vercel já parseia JSON) ou como string.
  let corpo = req.body;
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch { corpo = {}; }
  }

  const presente = buscarPresente(corpo && corpo.id);
  if (!presente) {
    return res.status(400).json({ erro: 'Presente não encontrado.' });
  }

  const origem = origemDe(req);
  const metodo = corpo && corpo.metodo === 'pix' ? 'pix' : 'cartao';

  const preferencia = {
    items: [
      {
        id: String(presente.id),
        title: presente.nome,
        description: `Cota da lista de presentes — Ingrid & Thiago`,
        category_id: 'services',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: presente.valor, // preço oficial, vindo do servidor
        picture_url: `${origem}/${presente.foto}`,
      },
    ],
    back_urls: {
      success: `${origem}/obrigado.html`,
      pending: `${origem}/obrigado.html`,
      failure: `${origem}/obrigado.html`,
    },
    auto_return: 'approved',
    statement_descriptor: 'CASAMENTO IT',
    external_reference: `presente-${presente.id}`,
    notification_url: `${origem}/api/webhook`,
    metadata: {
      presente_id: presente.id,
      presente_nome: presente.nome,
    },
  };

  // Restringe os meios de pagamento conforme o botão usado.
  if (metodo === 'pix') {
    // Somente Pix.
    preferencia.payment_methods = {
      excluded_payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'ticket' },
      ],
    };
  } else {
    // Somente cartão (sem boleto), parcelável em até 6x.
    preferencia.payment_methods = {
      excluded_payment_types: [{ id: 'ticket' }],
      installments: 6,
    };
  }

  try {
    const resposta = await fetch(MP_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Evita duplicar a preferência caso a requisição seja reenviada.
        'X-Idempotency-Key': `${presente.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: JSON.stringify(preferencia),
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      console.error('[pagamento] Mercado Pago recusou:', resposta.status, dados);
      return res.status(502).json({ erro: 'Não foi possível abrir o pagamento agora.' });
    }

    return res.status(200).json({
      init_point: dados.init_point,
      preference_id: dados.id,
    });
  } catch (err) {
    console.error('[pagamento] Falha ao chamar o Mercado Pago:', err);
    return res.status(502).json({ erro: 'Não foi possível abrir o pagamento agora.' });
  }
};
