import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Мобильное меню (< 920px, порог бургер-меню, §4.2) — бургер + shadcn Sheet.
 * Список пунктов приходит пропом из Header.astro (единый источник, не дублируем).
 *
 * @param {{
 *   links: { label: string, href: string }[],
 *   ctaHref: string,
 *   ctaLabel: string,
 *   pathname: string,
 *   className?: string,
 * }} props
 */
export default function MobileNav({ links, ctaHref, ctaLabel, pathname, className }) {
  const isActive = (href) =>
    href === "/blog" ? pathname === "/blog" || pathname.startsWith("/blog/") : pathname === href;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Открыть меню" className={className}>
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 border-l-2 border-line bg-surface sm:max-w-[380px]">
        <SheetHeader className="border-b-2 border-line p-[var(--space-5)]">
          <SheetTitle>Навигация</SheetTitle>
        </SheetHeader>
        <nav aria-label="Основная навигация" className="flex flex-1 flex-col gap-1 overflow-auto p-[var(--space-5)]">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <a
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-[var(--space-3)] py-[14px] font-heading text-[22px] leading-[28px] font-semibold no-underline",
                  isActive(link.href) ? "bg-hover text-ink" : "text-ink hover:bg-hover"
                )}
              >
                {link.label}
              </a>
            </SheetClose>
          ))}
          <SheetClose asChild>
            <a
              href={ctaHref}
              className="text-button mt-[var(--space-5)] flex h-[var(--control-height)] items-center justify-center rounded-xl border-2 border-transparent bg-accent px-6 text-belyi no-underline transition-colors duration-[var(--motion-button)] hover:border-ink hover:bg-transparent hover:text-ink"
            >
              {ctaLabel}
            </a>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
