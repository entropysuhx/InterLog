import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-ds-16">
      <section className="w-full max-w-panel-md rounded-xl border border-border bg-surface p-ds-24">
        <Link href="/dashboard" className="flex items-center gap-ds-8 text-heading-4 font-semibold text-text-primary">
          <span className="flex size-ds-32 items-center justify-center rounded-md bg-interactive-primary text-text-inverse">
            <Sparkles size={16} aria-hidden="true" />
          </span>
          InterLog
        </Link>
        <h1 className="mt-ds-32 text-heading-2 font-[650] text-text-primary">{title}</h1>
        <p className="mt-ds-8 text-body-sm text-text-secondary">{description}</p>
        <div className="mt-ds-24">{children}</div>
        <div className="mt-ds-20 border-t border-border pt-ds-16 text-center text-body-sm text-text-muted">{footer}</div>
      </section>
    </main>
  );
}
