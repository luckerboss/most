import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Переключатель светлой/тёмной темы.
 * Текущая тема хранится в атрибуте data-theme на <html> (выставляется
 * anti-FOUC-скриптом в BaseLayout до первой отрисовки), выбор пользователя —
 * в localStorage под ключом "theme". Иконки переключаются чистым CSS
 * (dark:-вариант), поэтому серверная и клиентская разметка совпадают.
 */
export default function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage может быть недоступен (приватный режим) — тема
      // просто не сохранится между визитами
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Переключить тему"
    >
      <Sun className="dark:hidden" aria-hidden="true" />
      <Moon className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
