/**
 * Заглушка: реальная логика (валидация, honeypot, rate limit, отправка в
 * Telegram Bot API, fallback в файл) приедет отдельной задачей 4.2.
 * 501 здесь — ожидаемое поведение, не баг.
 */
export const prerender = false;

export async function POST() {
  return new Response(
    JSON.stringify({ ok: false, error: 'not_implemented' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}
