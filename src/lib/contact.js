export const NAME_CHAR_RE = /[a-zA-Zа-яёА-ЯЁ]/;
const NAME_SEPARATORS = new Set([" ", "-", "'", "’"]);

export function sanitizeName(raw) {
  let out = "";
  for (const ch of raw) {
    if (NAME_CHAR_RE.test(ch)) {
      out += ch;
      continue;
    }
    if (NAME_SEPARATORS.has(ch)) {
      const last = out[out.length - 1];
      if (out.length > 0 && !NAME_SEPARATORS.has(last)) out += ch;
    }
  }
  return out;
}

const NAME_FULL_RE = /^[a-zA-Zа-яёА-ЯЁ]+(?:[ '’-][a-zA-Zа-яёА-ЯЁ]+)*$/;

export function isValidName(name) {
  return name.length >= 2 && name.length <= 60 && NAME_FULL_RE.test(name);
}

export function extractDigits(value) {
  return value.replace(/\D/g, "");
}

export function normalizePhoneDigits(digitsRaw) {
  if (!digitsRaw) return { digits: "", insertedAtStart: 0 };
  let digits = digitsRaw;
  let insertedAtStart = 0;
  if (digits[0] === "8") {
    digits = "7" + digits.slice(1);
  } else if (digits[0] === "9") {
    digits = "7" + digits;
    insertedAtStart = 1;
  }
  digits = digits.slice(0, 11);
  return { digits, insertedAtStart };
}

export function formatPhoneDigits(digits) {
  if (!digits) return "";
  const rest = digits.slice(1);
  let out = "+7";
  if (rest.length > 0) out += " (" + rest.slice(0, 3);
  if (rest.length >= 3) out += ")";
  if (rest.length > 3) out += " " + rest.slice(3, 6);
  if (rest.length > 6) out += "-" + rest.slice(6, 8);
  if (rest.length > 8) out += "-" + rest.slice(8, 10);
  return out;
}

export function normalizePhoneValue(value) {
  const { digits } = normalizePhoneDigits(extractDigits(value));
  return digits.length === 11 && digits[0] === "7" ? digits : null;
}

export function detectContactMode(raw) {
  const match = raw.match(/\S/);
  if (!match) return null;
  const ch = match[0];
  if (ch === "@" || NAME_CHAR_RE.test(ch)) return "nick";
  if (ch === "+" || /\d/.test(ch)) return "phone";
  return null;
}

const NICK_RE = /^@?[A-Za-z0-9_]{4,32}$/;
export function isValidNick(value) {
  return NICK_RE.test(value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value) {
  return EMAIL_RE.test(value);
}

export function validateContact(rawContact, segment) {
  const trimmed = rawContact.trim();
  if (!trimmed) return { ok: false };

  if (segment === "it") {
    if (trimmed.startsWith("@")) {
      return isValidNick(trimmed) ? { ok: true, normalized: trimmed } : { ok: false };
    }
    return isValidEmail(trimmed) ? { ok: true, normalized: trimmed.toLowerCase() } : { ok: false };
  }

  const mode = detectContactMode(trimmed);
  if (mode === "nick") {
    if (!isValidNick(trimmed)) return { ok: false };
    return { ok: true, normalized: trimmed.startsWith("@") ? trimmed : `@${trimmed}` };
  }
  if (mode === "phone") {
    const normalizedPhone = normalizePhoneValue(trimmed);
    if (!normalizedPhone) return { ok: false };
    return { ok: true, normalized: formatPhoneDigits(normalizedPhone) };
  }
  return { ok: false };
}
