/**
 * POST /api/webhook
 *
 * Recebe as notificações do Mercado Pago (pagamento criado/aprovado etc.).
 * O Mercado Pago espera resposta 200 em até 22 segundos, senão fica
 * reenviando a cada 15 minutos.
 *
 * Variáveis de ambiente (as duas são OPCIONAIS):
 *   MP_WEBHOOK_SECRET → ativa a validação da assinatura (recomendado)
 *   MP_ACCESS_TOKEN   → permite consultar o pagamento e logar o resultado
 *
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

const crypto = require('crypto');

/**
 * Valida o cabeçalho x-signature.
 * Manifest: id:{data.id};request-id:{x-request-id};ts:{ts};
 */
function assinaturaValida(req, secret) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature || !xRequestId) return false;

  let ts = '';
  let v1 = '';
  for (const parte of String(xSignature).split(',')) {
    const i = parte.indexOf('=');
    if (i === -1) continue;
    const chave = parte.slice(0, i).trim();
    const valor = parte.slice(i + 1).trim();
    if (chave === 'ts') ts = valor;
    if (chave === 'v1') v1 = valor;
  }
  if (!ts || !v1) return false;

  // O data.id vem da query string; se for alfanumérico, o MP usa minúsculas.
  let dataId = req.query && (req.query['data.id'] || req.query.id);
  if (Array.isArray(dataId)) dataId = dataId[0];
  dataId = dataId ? String(dataId).toLowerCase() : '';

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(esperado, 'utf8');
  const b = Buffer.from(v1, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret && !assinaturaValida(req, secret)) {
    console.warn('[webhook] Assinatura inválida — notificação ignorada.');
    return res.status(401).end();
  }

  let corpo = req.body;
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch { corpo = {}; }
  }
  corpo = corpo || {};

  const tipo = corpo.type || corpo.topic;
  const pagamentoId = corpo.data && corpo.data.id;

  // Responde já: qualquer trabalho extra não pode atrasar o 200.
  res.status(200).json({ recebido: true });

  // A partir daqui é só registro em log (aparece em Vercel → Logs).
  if (tipo !== 'payment' || !pagamentoId) return;

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return;

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return;
    const p = await r.json();
    console.log('[webhook] pagamento', {
      id: p.id,
      status: p.status,
      valor: p.transaction_amount,
      presente: p.external_reference,
      pagador: p.payer && p.payer.email,
    });
  } catch (err) {
    console.error('[webhook] Falha ao consultar o pagamento:', err);
  }
};
