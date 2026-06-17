"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
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
import { useEffect, useRef, useState } from "react";

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
  userImage,
}: AppShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "focus">("light");
  const accountMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        accountMenuRef.current &&
        event.target instanceof Node &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Target;
  const themeLabel =
    theme === "focus" ? "Focus Theme" : theme === "dark" ? "Dark Theme" : "Light Theme";

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
          "fixed inset-y-0 left-0 z-modal flex h-dvh w-shell-sidebar flex-col border-r border-border bg-surface p-ds-16 transition-transform lg:sticky lg:top-0 lg:z-base lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          href="/"
          className="flex min-h-touch-target items-center gap-ds-12 text-heading-4 font-semibold text-text-primary"
          onClick={() => setIsOpen(false)}
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

        <div className="mt-auto shrink-0 space-y-ds-12 pt-ds-16">
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
            onClick={() => setIsOpen(false)}
            className="flex min-h-touch-target items-center gap-ds-12 rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
          >
            <Settings size={18} aria-hidden="true" />
            Settings
          </Link>
          {isAuthenticated && (
            <div className="flex min-h-touch-target items-center gap-ds-12 rounded-md bg-surface-subtle px-ds-12 text-label text-text-primary">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt="" className="size-ds-32 rounded-full object-cover" />
              ) : (
                <span className="flex size-ds-32 items-center justify-center rounded-full bg-interactive-primary text-text-inverse">
                  {(userName ?? "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 truncate">{userName ?? "Signed in"}</span>
            </div>
          )}
          <div className="border-t border-border pt-ds-12 text-caption text-text-muted">
            {isAuthenticated ? "Synced to your account" : "Guest mode / Stored on this device"}
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
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                className="flex min-h-touch-target items-center gap-ds-8 rounded-md border border-border bg-surface px-ds-12 text-label font-[550] text-text-secondary hover:bg-surface-hover"
                onClick={() => setIsAccountMenuOpen((value) => !value)}
              >
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt="" className="size-ds-24 rounded-full object-cover" />
                ) : (
                  <span className="flex size-ds-24 items-center justify-center rounded-full bg-interactive-primary text-caption text-text-inverse">
                    {(userName ?? "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-panel-sm truncate sm:inline">
                  {userName ?? "Account"}
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {isAccountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-ds-8 w-panel-sm rounded-lg border border-border bg-surface-elevated p-ds-8 shadow-lg"
                >
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex min-h-touch-target items-center rounded-md px-ds-12 text-label text-text-secondary hover:bg-surface-hover"
                  >
                    Account settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex min-h-touch-target w-full items-center rounded-md px-ds-12 text-left text-label text-text-secondary hover:bg-surface-hover"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      void signOut({ callbackUrl: "/dashboard" });
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="flex min-h-touch-target items-center rounded-md border border-border bg-interactive-secondary px-ds-16 text-label font-[550] text-text-secondary hover:bg-interactive-secondary-hover"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="flex min-h-touch-target items-center rounded-md bg-interactive-primary px-ds-16 text-label font-[550] text-text-inverse hover:bg-interactive-primary-hover"
              >
                Save Progress
              </Link>
            </>
          )}
        </header>
        <ProductDataProvider
          initialSnapshot={initialSnapshot}
          isAuthenticated={isAuthenticated}
          userName={userName}
          userImage={userImage}
        >
          <main className="mx-auto mt-shell-topbar flex-1 w-full max-w-content p-ds-16 md:p-ds-24 lg:p-ds-32 min-h-[calc(100vh-var(--spacing-shell-topbar)-60px)]">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-content px-ds-16 md:px-ds-24 lg:px-ds-32 pb-ds-24 flex justify-end gap-ds-16 text-caption text-text-muted">
            <Link href="/" className="hover:text-text-primary">
              About InterLog
            </Link>
            <Link href="#" className="hover:text-text-primary">
              Terms & Conditions
            </Link>
            <Link href="#" className="hover:text-text-primary">
              Privacy Policy
            </Link>
          </footer>
        </ProductDataProvider>
      </div>
    </div>
  );
}
