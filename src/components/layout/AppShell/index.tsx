"use client";

import {
  BarChart3,
  CalendarDays,
  Clock3,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  NotebookPen,
  Settings,
  Sparkles,
  Sun,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import type { AppShellProps } from "@/components/layout/AppShell/AppShell.types";
import ProductDataProvider from "@/components/providers/ProductDataProvider";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/timeline", label: "Timeline", icon: Clock3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
  { href: "/reflection", label: "Reflections", icon: NotebookPen },
  { href: "/wrapped", label: "Wrapped", icon: LayoutDashboard },
] as const;

export default function AppShell({
  children,
  initialSnapshot,
  isAuthenticated,
  userName,
}: AppShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "focus">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("interlog:theme");
    const selected = stored === "dark" || stored === "focus" ? stored : "light";
    setTheme(selected);
    document.documentElement.dataset.theme = selected;
  }, []);

  function handleThemeChange() {
    const next = theme === "light" ? "dark" : theme === "dark" ? "focus" : "light";
    setTheme(next);
    window.localStorage.setItem("interlog:theme", next);
    document.documentElement.dataset.theme = next;
  }

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Target;
  const themeLabel = theme === "focus" ? "Focus Theme" : theme === "dark" ? "Dark Theme" : "Light Theme";

  return (
    <div className="app-shell-grid bg-background">
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-overlay bg-overlay lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <button
        type="button"
        className="fixed left-ds-16 top-ds-12 z-tooltip flex size-touch-target items-center justify-center rounded-md border border-border bg-surface text-text-primary lg:hidden"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-modal flex w-shell-sidebar flex-col border-r border-border bg-surface p-ds-16 transition-transform lg:sticky lg:top-0 lg:z-base lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          href="/dashboard"
          className="flex min-h-touch-target items-center gap-ds-12 text-heading-4 font-semibold text-text-primary"
        >
          <span className="flex size-ds-32 items-center justify-center rounded-md bg-interactive-primary text-text-inverse">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          InterLog
        </Link>

        <nav className="mt-ds-32 flex flex-col gap-ds-4" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex min-h-touch-target items-center gap-ds-12 rounded-md px-ds-12 text-label font-[550] transition-colors",
                  isActive
                    ? "bg-surface-active text-text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-ds-12">
          <div className="rounded-lg border border-border bg-surface-subtle p-ds-16">
            <p className="flex items-center gap-ds-8 text-label font-[550] text-text-primary">
              <Sparkles size={16} aria-hidden="true" />
              AI that explains itself
            </p>
            <p className="mt-ds-8 text-caption text-text-muted">
              Insights show their evidence and never read reflection text.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex min-h-touch-target items-center gap-ds-12 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
          >
            <Settings size={18} aria-hidden="true" />
            Settings
          </Link>
          <div className="border-t border-border pt-ds-12 text-caption text-text-muted">
            {isAuthenticated ? userName ?? "Signed in" : "Guest mode · Stored on this device"}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="fixed left-0 right-0 top-0 z-toast flex min-h-shell-topbar items-center justify-end gap-ds-8 border-b border-border bg-background px-ds-16 lg:left-shell-sidebar lg:px-ds-32">
          <button
            type="button"
            aria-label={`Switch theme. Current theme: ${theme}`}
            className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border bg-surface px-ds-12 text-label text-text-secondary hover:border-border-hover hover:bg-surface-hover"
            onClick={handleThemeChange}
          >
            <ThemeIcon size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{themeLabel}</span>
          </button>
          {isAuthenticated ? (
            <button
              type="button"
              className="flex min-h-touch-target items-center rounded-md border border-border bg-surface px-ds-16 text-label font-[550] text-text-secondary hover:bg-surface-hover"
              onClick={() => void signOut({ callbackUrl: "/dashboard" })}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="flex min-h-touch-target items-center rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover"
            >
              Save progress
            </Link>
          )}
        </header>
        <ProductDataProvider
          initialSnapshot={initialSnapshot}
          isAuthenticated={isAuthenticated}
        >
          <main className="mx-auto mt-shell-topbar flex-1 w-full max-w-content p-ds-16 md:p-ds-24 lg:p-ds-32 min-h-[calc(100vh-var(--spacing-shell-topbar)-60px)]">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-content px-ds-16 md:px-ds-24 lg:px-ds-32 pb-ds-24 flex justify-end gap-ds-16 text-caption text-text-muted">
            <Link href="/" className="hover:text-text-primary">About InterLog</Link>
            <Link href="#" className="hover:text-text-primary">Terms & Conditions</Link>
            <Link href="#" className="hover:text-text-primary">Privacy Policy</Link>
          </footer>
        </ProductDataProvider>
      </div>
    </div>
  );
}
