import { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import LeadForm from "@/components/LeadForm.jsx";
import { reachGoal } from "@/lib/analytics";

const SEGMENT_CONTENT = {
  business: {
    overline: "ДЛЯ МАЛОГО БИЗНЕСА",
    title: "Записаться на диагностику",
    subtitle: "1–2 недели · 40–80 тыс ₽",
    overlineAccent: "text-green",
  },
  it: {
    overline: "ДЛЯ ПРОДУКТА ИЛИ КОМАНДЫ",
    title: "Получить бесплатное ревью ТЗ",
    subtitle: "30-минутный созвон · бесплатно и без обязательств",
    overlineAccent: "text-accent",
  },
};

const AUTO_CLOSE_DELAY_MS = 5000;

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function LeadModal() {
  const [open, setOpen] = useState(false);
  const [segment, setSegment] = useState(null);
  const triggerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

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
      reachGoal("modal_open", { segment: nextSegment });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    return () => clearTimeout(closeTimeoutRef.current);
  }, []);

  function handleOpenChange(next) {
    setOpen(next);
    if (!next) {
      clearTimeout(closeTimeoutRef.current);
    }
  }

  function handleFormSuccess() {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpen(false), AUTO_CLOSE_DELAY_MS);
  }

  function handleCloseAutoFocus(event) {
    event.preventDefault();
    triggerRef.current?.focus({ preventScroll: true });
  }

  const content = segment ? SEGMENT_CONTENT[segment] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <LeadForm segment={segment} variant="modal" onSuccess={handleFormSuccess} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
