import { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import LeadForm from "@/components/LeadForm.jsx";
import { YM_COUNTER_ID } from "@/consts";

const SEGMENT_CONTENT = {
  business: {
    overline: "ДЛЯ МАЛОГО БИЗНЕСА",
    title: "Записаться на диагностику",
    subtitle: "1–2 недели · 40–80 тыс ₽ · ответим в течение рабочего дня",
    overlineAccent: "text-green",
  },
  it: {
    overline: "ДЛЯ ПРОДУКТА ИЛИ КОМАНДЫ",
    title: "Получить бесплатное ревью ТЗ",
    subtitle: "30-минутный созвон · бесплатно и без обязательств",
    overlineAccent: "text-accent",
  },
};

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function sendModalOpenGoal(segment) {
  if (typeof window.ym === "function") {
    window.ym(YM_COUNTER_ID, "reachGoal", "modal_open", { segment });
  }
}

/**
 * Глобальная модалка с формой заявки — один экземпляр на страницу
 * (BaseLayout, client:idle). Открывается делегированием кликов по документу:
 * любой элемент с data-lead-modal="business"|"it" в разметке триггерит
 * модалку, без обёрток-триггеров вокруг каждой ссылки. Обычный переход по
 * ссылке (новая вкладка, Cmd/Ctrl/Shift/Alt-клик) не перехватывается — сайт
 * работает по-старому без JS.
 */
export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [segment, setSegment] = useState(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    function onClick(event) {
      if (!isPlainLeftClick(event)) return;

      const trigger = event.target.closest?.("[data-lead-modal]");
      if (!trigger) return;
      if (trigger.tagName === "A" && trigger.target === "_blank") return;

      const nextSegment = trigger.getAttribute("data-lead-modal");
      if (nextSegment !== "business" && nextSegment !== "it") return;

      event.preventDefault();
      triggerRef.current = trigger;
      setSegment(nextSegment);
      setOpen(true);
      sendModalOpenGoal(nextSegment);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /**
   * Открытие идёт через делегирование кликов, а не Dialog.Trigger, поэтому
   * Radix не знает, куда вернуть фокус при закрытии, — держим триггер сами
   * и перехватываем onCloseAutoFocus (иначе фокус улетает на body: в этой
   * версии Radix эффект автофокуса пересоздаётся на промежуточном рендере
   * open→closed и к моменту реального размонтирования ссылается на элемент
   * внутри формы, который уже удалён из DOM).
   */
  function handleCloseAutoFocus(event) {
    event.preventDefault();
    triggerRef.current?.focus({ preventScroll: true });
  }

  const content = segment ? SEGMENT_CONTENT[segment] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onCloseAutoFocus={handleCloseAutoFocus}>
        {content && (
          <>
            <div className="flex flex-col gap-[var(--space-2)]">
              <span className={`text-overline ${content.overlineAccent}`}>
                {content.overline}
              </span>
              <DialogTitle className="text-h3 text-ink">{content.title}</DialogTitle>
              <p className="text-body-s text-muted">{content.subtitle}</p>
            </div>
            <LeadForm segment={segment} variant="modal" />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
