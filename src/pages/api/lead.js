/**
 * POST /api/lead — приём заявок с форм LeadFormBusiness/LeadFormIt.
 * Контракт запроса/ответа зафиксирован заранее для задачи 4.3 (оживление форм).
 */
import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

export const prerender = false;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

/** ip -> timestamps[] последних запросов в пределах окна */
const rateLimitStore = new Map();

const LIMITS = {
  name: 100,
  contact: 200,
  niche: 60,
  pain: 1000,
  link: 500,
  page: 200,
};

function getClientIp(request, context) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0].trim();
    if (first) return first;
  }
  return context.clientAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ip) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  return false;
}

function truncate(value, max) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function validate(body) {
  const fields = {};

  const segment = body.segment === 'business' || body.segment === 'it' ? body.segment : undefined;
  if (!segment) fields.segment = 'required';

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > LIMITS.name) fields.name = 'required';

  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
  if (!contact || contact.length > LIMITS.contact) fields.contact = 'required';

  if (body.agree !== true) fields.agree = 'required';

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  const page = truncate(body.page, LIMITS.page);
  const lead = { segment, name, contact, page };

  if (segment === 'business') {
    const niche = truncate(body.niche, LIMITS.niche);
    const pain = truncate(body.pain, LIMITS.pain);
    if (niche !== undefined) lead.niche = niche;
    if (pain !== undefined) lead.pain = pain;
  } else {
    const link = truncate(body.link, LIMITS.link);
    if (link !== undefined) lead.link = link;
  }

  return { ok: true, lead };
}

function buildMessage(lead) {
  const lines = [
    `🆕 Новый лид #${lead.segment}`,
    `Страница: ${lead.page || '—'}`,
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
  ];

  if (lead.segment === 'business') {
    if (lead.niche) lines.push(`Ниша: ${lead.niche}`);
    if (lead.pain) lines.push(`Что болит: ${lead.pain}`);
  } else if (lead.segment === 'it') {
    if (lead.link) lines.push(`Ссылка на ТЗ: ${lead.link}`);
  }

  return lines.join('\n');
}

async function sendToTelegram(text) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function writeFallback(ip, lead) {
  const filePath = process.env.LEAD_FALLBACK_PATH
    ? process.env.LEAD_FALLBACK_PATH
    : path.resolve(process.cwd(), 'leads-fallback.jsonl');

  const entry = {
    ts: new Date().toISOString(),
    ip,
    ...lead,
  };

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf-8');
  } catch (error) {
    console.error('lead fallback write failed:', error.message);
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST({ request, clientAddress }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, error: 'invalid_body' });
  }

  const ip = getClientIp(request, { clientAddress });

  if (isRateLimited(ip)) {
    return jsonResponse(429, { ok: false, error: 'rate_limited' });
  }

  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return jsonResponse(200, { ok: true });
  }

  const validation = validate(body);
  if (!validation.ok) {
    return jsonResponse(400, { ok: false, error: 'validation', fields: validation.fields });
  }

  const { lead } = validation;
  const text = buildMessage(lead);
  const sent = await sendToTelegram(text);

  if (!sent) {
    await writeFallback(ip, lead);
  }

  return jsonResponse(200, { ok: true });
}
