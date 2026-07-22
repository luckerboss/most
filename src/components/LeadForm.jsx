import { useId, useRef, useState } from "react";
import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CONTACTS } from "@/consts";

const NICHES = [
  "Салон красоты",
  "Фитнес или студия",
  "Магазин",
  "Кафе или доставка",
  "Услуги",
  "Другое",
];

const SEGMENT_CONFIG = {
  business: {
    ctaText: "Записаться на диагностику",
    contactLabel: "Телефон или Telegram",
    contactPlaceholder: "+7… или @ник",
    contactAutoComplete: "tel",
    fieldFocus: "focus:border-green",
    linkText: "text-green",
    linkHoverText: "hover:text-green-hover",
    buttonBg: "bg-green",
    checkboxChecked: "data-checked:border-green data-checked:bg-green",
    accentText: "text-green",
  },
  it: {
    ctaText: "Получить бесплатное ревью ТЗ",
    contactLabel: "Email или Telegram",
    contactPlaceholder: "you@company.ru или @ник",
    contactAutoComplete: "email",
    fieldFocus: "focus:border-accent",
    linkText: "text-accent",
    linkHoverText: "hover:text-accent-hover",
    buttonBg: "bg-accent",
    checkboxChecked: "data-checked:border-accent data-checked:bg-accent",
    accentText: "text-accent",
  },
};

const FIELD_BASE =
  "h-[var(--control-height)] w-full rounded-lg border-2 border-line bg-surface px-[var(--space-4)] text-body text-ink ring-0 transition-colors duration-[var(--motion-card)] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const TEXTAREA_BASE =
  "field-sizing-fixed min-h-[96px] w-full resize-y rounded-lg border-2 border-line bg-surface px-[var(--space-4)] py-[var(--space-3)] text-body text-ink ring-0 transition-colors duration-[var(--motion-card)] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const SELECT_TRIGGER_BASE =
  "h-[var(--control-height)] w-full justify-between rounded-lg border-2 border-line bg-surface px-[var(--space-4)] text-body text-ink ring-0 transition-colors duration-[var(--motion-card)] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60 data-placeholder:text-muted";

const CHECKBOX_BASE =
  "mt-[3px] h-[18px] w-[18px] shrink-0 border-2 border-line ring-0 focus-visible:ring-0";

const FIELD_ERROR_MESSAGES = {
  name: "Введите имя",
  contact: "Укажите контакт",
  agree: "Нужно согласие на обработку данных",
};

/**
 * Клиентская валидация — зеркалит обязательные поля серверной схемы
 * (см. validate() в src/pages/api/lead.js: name, contact, agree), но мягче:
 * не проверяет длину и формат — за это отвечает сервер.
 */
function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = FIELD_ERROR_MESSAGES.name;
  if (!values.contact.trim()) errors.contact = FIELD_ERROR_MESSAGES.contact;
  if (!values.agree) errors.agree = FIELD_ERROR_MESSAGES.agree;
  return errors;
}

/** Переводит fields{} из ответа 400/validation в сообщения под полями. */
function mapServerErrors(fields) {
  const errors = {};
  for (const key of Object.keys(fields)) {
    if (FIELD_ERROR_MESSAGES[key]) errors[key] = FIELD_ERROR_MESSAGES[key];
  }
  return errors;
}

/** Собирает тело POST /api/lead по контракту 4.2. */
function buildPayload(segment, values, page) {
  const payload = {
    segment,
    page,
    name: values.name.trim(),
    contact: values.contact.trim(),
    agree: values.agree,
    company: values.company,
  };

  if (segment === "business") {
    payload.niche = values.niche;
    payload.pain = values.pain.trim();
  } else {
    payload.link = values.link.trim();
  }

  return payload;
}

/**
 * Форма заявки — правая колонка LeadFormBusiness.astro / LeadFormIt.astro.
 * Один компонент на оба сегмента: набор полей, акцент и CTA зависят от
 * пропа segment. Валидация и отправка — на клиенте, без сторонних
 * form-либов; контракт запроса/ответа — /api/lead (задача 4.2, не менять).
 */
export default function LeadForm({ segment }) {
  const config = SEGMENT_CONFIG[segment];
  const uid = useId();

  const [values, setValues] = useState({
    name: "",
    contact: "",
    niche: NICHES[0],
    pain: "",
    link: "",
    agree: false,
    company: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState(null);

  const nameRef = useRef(null);
  const contactRef = useRef(null);
  const agreeRef = useRef(null);

  const ids = {
    company: `${uid}-company`,
    name: `${uid}-name`,
    nameError: `${uid}-name-error`,
    contact: `${uid}-contact`,
    contactError: `${uid}-contact-error`,
    niche: `${uid}-niche`,
    pain: `${uid}-pain`,
    link: `${uid}-link`,
    linkHint: `${uid}-link-hint`,
    agree: `${uid}-agree`,
    agreeError: `${uid}-agree-error`,
  };

  const isSubmitting = status === "submitting";

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function focusFirstInvalid(fieldErrors) {
    if (fieldErrors.name) nameRef.current?.focus();
    else if (fieldErrors.contact) contactRef.current?.focus();
    else if (fieldErrors.agree) agreeRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const fieldErrors = validate(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirstInvalid(fieldErrors);
      return;
    }

    setErrors({});
    setNotice(null);
    setStatus("submitting");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(segment, values, window.location.pathname)),
      });

      if (response.ok) {
        setStatus("success");
        return;
      }

      if (response.status === 429) {
        setStatus("idle");
        setNotice("rate_limited");
        return;
      }

      if (response.status === 400) {
        const data = await response.json().catch(() => null);
        const mapped =
          data?.error === "validation" && data.fields ? mapServerErrors(data.fields) : {};
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          focusFirstInvalid(mapped);
          setStatus("idle");
          return;
        }
      }

      setStatus("idle");
      setNotice("generic");
    } catch {
      setStatus("idle");
      setNotice("generic");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-[var(--space-3)] rounded-2xl border-2 border-line bg-surface p-[var(--space-6)] md:p-[var(--space-7)]"
      >
        <Check className={config.accentText} aria-hidden="true" />
        <p className="text-body-article text-ink">
          Заявка отправлена — ответим в течение рабочего дня.
        </p>
      </div>
    );
  }

  return (
    <form
      data-reveal
      data-reveal-delay="100"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-[var(--space-4)] rounded-2xl border-2 border-line bg-surface p-[var(--space-6)] md:p-[var(--space-7)]"
    >
      <div className="hidden" aria-hidden="true">
        <label htmlFor={ids.company}>Не заполняйте это поле</label>
        <input
          id={ids.company}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={(e) => setField("company", e.target.value)}
          suppressHydrationWarning
        />
      </div>

      <label className="flex flex-col gap-[var(--space-2)]" htmlFor={ids.name}>
        <span className="text-sm font-medium text-ink">Как вас зовут</span>
        <Input
          id={ids.name}
          ref={nameRef}
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Имя"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? ids.nameError : undefined}
          className={`${FIELD_BASE} ${config.fieldFocus}`}
          suppressHydrationWarning
        />
        {errors.name && (
          <span id={ids.nameError} className="text-caption text-red">
            {errors.name}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-[var(--space-2)]" htmlFor={ids.contact}>
        <span className="text-sm font-medium text-ink">{config.contactLabel}</span>
        <Input
          id={ids.contact}
          ref={contactRef}
          name="contact"
          type="text"
          autoComplete={config.contactAutoComplete}
          placeholder={config.contactPlaceholder}
          value={values.contact}
          onChange={(e) => setField("contact", e.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.contact)}
          aria-describedby={errors.contact ? ids.contactError : undefined}
          className={`${FIELD_BASE} ${config.fieldFocus}`}
          suppressHydrationWarning
        />
        {errors.contact && (
          <span id={ids.contactError} className="text-caption text-red">
            {errors.contact}
          </span>
        )}
      </label>

      {segment === "business" ? (
        <>
          <label className="flex flex-col gap-[var(--space-2)]" htmlFor={ids.niche}>
            <span className="text-sm font-medium text-ink">Чем занимаетесь</span>
            <Select
              value={values.niche}
              onValueChange={(value) => setField("niche", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id={ids.niche}
                className={`${SELECT_TRIGGER_BASE} ${config.fieldFocus}`}
              >
                <SelectValue placeholder="Чем занимаетесь" />
              </SelectTrigger>
              <SelectContent>
                {NICHES.map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-[var(--space-2)]" htmlFor={ids.pain}>
            <span className="text-sm font-medium text-ink">Что болит сильнее всего</span>
            <Textarea
              id={ids.pain}
              name="pain"
              rows={4}
              placeholder="Например: заявки приходят в три места, половину теряем…"
              value={values.pain}
              onChange={(e) => setField("pain", e.target.value)}
              disabled={isSubmitting}
              className={`${TEXTAREA_BASE} ${config.fieldFocus}`}
              suppressHydrationWarning
            />
          </label>
        </>
      ) : (
        <label className="flex flex-col gap-[var(--space-2)]" htmlFor={ids.link}>
          <span className="text-sm font-medium text-ink">Ссылка на ТЗ или бэклог</span>
          <Input
            id={ids.link}
            name="link"
            type="url"
            placeholder="Notion, Google Docs, Confluence…"
            value={values.link}
            onChange={(e) => setField("link", e.target.value)}
            disabled={isSubmitting}
            aria-describedby={ids.linkHint}
            className={`${FIELD_BASE} ${config.fieldFocus}`}
            suppressHydrationWarning
          />
          <span id={ids.linkHint} className="text-caption text-muted">
            Нет документа? Опишите продукт парой фраз в этом поле — тоже сработает.
          </span>
        </label>
      )}

      <div className="flex flex-col gap-[var(--space-2)]">
        <label className="flex cursor-pointer items-start gap-[var(--space-3)]" htmlFor={ids.agree}>
          <Checkbox
            id={ids.agree}
            ref={agreeRef}
            name="agree"
            checked={values.agree}
            onCheckedChange={(checked) => setField("agree", checked === true)}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.agree)}
            aria-describedby={errors.agree ? ids.agreeError : undefined}
            className={`${CHECKBOX_BASE} ${config.checkboxChecked}`}
            suppressHydrationWarning
          />
          <span className="text-sm text-muted">
            Согласен на обработку персональных данных по{" "}
            <a href="/privacy" className={`${config.linkText} ${config.linkHoverText}`}>
              политике конфиденциальности
            </a>
          </span>
        </label>
        {errors.agree && (
          <span id={ids.agreeError} className="text-caption text-red">
            {errors.agree}
          </span>
        )}
      </div>

      {notice && (
        <div
          role="alert"
          className="rounded-lg border-2 border-red-border bg-red-tint px-[var(--space-4)] py-[var(--space-3)] text-body-s text-red"
        >
          {notice === "rate_limited" ? (
            "Слишком много попыток, попробуйте позже"
          ) : (
            <>
              Не получилось отправить. Напишите напрямую в{" "}
              <a href={CONTACTS.telegram.url} className="underline">
                Telegram · {CONTACTS.telegram.handle}
              </a>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`text-button inline-flex h-[var(--control-height)] items-center justify-center rounded-xl border-2 border-transparent px-6 text-belyi transition-colors duration-[var(--motion-button)] hover:border-ink hover:bg-transparent hover:text-ink disabled:pointer-events-none disabled:opacity-60 ${config.buttonBg}`}
      >
        {isSubmitting ? "Отправляем…" : config.ctaText}
      </button>
    </form>
  );
}
