import Link from "next/link";
import { ArrowRight, Clock3, NotebookPen, BarChart3, Sparkles } from "lucide-react";
import { MockTimelineCard, MockInsightCard } from "@/components/landing/MockUI";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-interactive-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-ds-20 py-ds-16 sm:px-ds-32">
          <Link
            href="/"
            className="flex items-center gap-ds-8 text-heading-4 font-semibold text-text-primary"
          >
            <span className="flex size-ds-24 items-center justify-center rounded-md bg-interactive-primary text-text-inverse">
              <Clock3 size={16} />
            </span>
            InterLog
          </Link>
          <div className="flex items-center gap-ds-16">
            <Link
              href="/dashboard"
              className="hidden sm:inline text-label font-[550] text-text-secondary transition-colors hover:text-text-primary"
            >
              See How It Works
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex min-h-touch-target items-center justify-center rounded-md bg-interactive-primary px-ds-12 text-label text-text-inverse transition-colors hover:bg-interactive-primary-hover"
            >
              Go to App
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96">
          <div className="grid gap-ds-64 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col items-start gap-ds-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h1 className="text-heading-1 font-[650] leading-tight text-text-primary">
                Understand Where Your Time Really Goes.
              </h1>
              <p className="max-w-reading text-body-lg text-text-secondary">
                Track your days, reflect on your weeks, and uncover meaningful patterns with
                AI-powered insights. Built with reflection, not productivity pressure.
              </p>
              <div className="flex flex-wrap gap-ds-16">
                <Link
                  href="/dashboard"
                  className="flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md bg-interactive-primary px-ds-20 text-label text-text-inverse transition-colors hover:bg-interactive-primary-hover"
                >
                  Try InterLog
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md border border-border bg-surface px-ds-20 text-label text-text-primary transition-colors hover:bg-surface-hover"
                >
                  See How It Works
                </a>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-ds-16 rounded-2xl border border-border bg-surface-subtle p-ds-32 shadow-xl animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
              <MockTimelineCard />
              <div className="opacity-75">
                <MockInsightCard type="noticing" />
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="bg-surface py-ds-64 sm:py-ds-96 border-y border-border">
          <div className="mx-auto max-w-reading px-ds-20 text-center sm:px-ds-32">
            <h2 className="text-heading-2 font-[650] text-text-primary">
              Most time trackers stop at numbers.
            </h2>
            <p className="mt-ds-24 text-body-lg leading-relaxed text-text-secondary">
              Hours tracked don&rsquo;t tell the whole story. InterLog helps you understand not just
              how you spent your time, but{" "}
              <strong className="font-semibold text-text-primary">what that time meant</strong>.
              Reflection before optimization.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96">
          <div className="grid gap-ds-32 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-ds-12 rounded-xl border border-border bg-surface p-ds-24 shadow-sm hover:border-border-hover transition-colors">
              <span className="flex size-ds-40 items-center justify-center rounded-lg bg-surface-subtle text-interactive-primary">
                <Clock3 size={20} />
              </span>
              <h3 className="text-heading-4 font-semibold text-text-primary">Timeline</h3>
              <p className="text-body-sm text-text-secondary">
                See your day unfold hour by hour. Track work, learning, exercise, meetings, and
                personal moments in one place.
              </p>
            </div>
            <div className="flex flex-col gap-ds-12 rounded-xl border border-border bg-surface p-ds-24 shadow-sm hover:border-border-hover transition-colors">
              <span className="flex size-ds-40 items-center justify-center rounded-lg bg-surface-subtle text-interactive-primary">
                <NotebookPen size={20} />
              </span>
              <h3 className="text-heading-4 font-semibold text-text-primary">Reflection</h3>
              <p className="text-body-sm text-text-secondary">
                Capture thoughts, lessons, and wins from each day. Build a personal history you can
                revisit.
              </p>
            </div>
            <div className="flex flex-col gap-ds-12 rounded-xl border border-border bg-surface p-ds-24 shadow-sm hover:border-border-hover transition-colors">
              <span className="flex size-ds-40 items-center justify-center rounded-lg bg-surface-subtle text-interactive-primary">
                <BarChart3 size={20} />
              </span>
              <h3 className="text-heading-4 font-semibold text-text-primary">Insights</h3>
              <p className="text-body-sm text-text-secondary">
                Discover patterns in how you spend your time. See trends across days, weeks, and
                months.
              </p>
            </div>
            <div className="flex flex-col gap-ds-12 rounded-xl border border-border bg-surface p-ds-24 shadow-sm hover:border-border-hover transition-colors">
              <span className="flex size-ds-40 items-center justify-center rounded-lg bg-surface-subtle text-interactive-primary">
                <Sparkles size={20} />
              </span>
              <h3 className="text-heading-4 font-semibold text-text-primary">AI Reflection</h3>
              <p className="text-body-sm text-text-secondary">
                Turn activity logs into meaningful reflections. Generate gentle insights like
                &ldquo;One Thing Worth Noticing.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="bg-surface py-ds-64 sm:py-ds-96 border-y border-border"
        >
          <div className="mx-auto max-w-7xl px-ds-20 sm:px-ds-32">
            <h2 className="mb-ds-48 text-center text-heading-2 font-[650] text-text-primary">
              How It Works
            </h2>
            <div className="grid gap-ds-32 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Track your time",
                  desc: "Log activities quickly without complex forms.",
                },
                {
                  step: "2",
                  title: "Reflect on your day",
                  desc: "Add a simple sentence about what mattered.",
                },
                {
                  step: "3",
                  title: "Discover patterns",
                  desc: "See your natural rhythms emerge over time.",
                },
                {
                  step: "4",
                  title: "Generate AI insights",
                  desc: "Let AI synthesize your logs into a supportive narrative.",
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center gap-ds-16">
                  <span className="flex size-ds-48 items-center justify-center rounded-full border-2 border-border-active bg-surface text-heading-4 font-semibold text-interactive-primary">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-label font-[550] text-text-primary">{item.title}</h3>
                    <p className="mt-ds-4 text-body-sm text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Showcase Section */}
        <section className="mx-auto max-w-7xl px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96">
          <div className="mb-ds-48 text-center">
            <h2 className="text-heading-2 font-[650] text-text-primary">Your Time Has a Story.</h2>
            <p className="mt-ds-12 text-body-lg text-text-secondary">
              Our AI doesn&rsquo;t score you. It notices the patterns you might miss.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-ds-24 sm:grid-cols-2 lg:grid-cols-3">
            <MockInsightCard type="reflection" />
            <MockInsightCard type="noticing" />
            <MockInsightCard type="letter" />
          </div>
        </section>

        {/* Social Proof Placeholder */}
        <section className="bg-surface py-ds-64 sm:py-ds-96 border-y border-border">
          <div className="mx-auto max-w-reading px-ds-20 text-center sm:px-ds-32">
            <p className="text-heading-3 font-semibold italic text-text-primary">
              &ldquo;Built for students, creators, freelancers, and lifelong learners.&rdquo;
            </p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="mx-auto max-w-7xl px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="text-heading-2 font-[650] text-text-primary">
              Start Understanding Your Time.
            </h2>
            <p className="mt-ds-16 mb-ds-32 text-body-lg text-text-secondary">
              Track your days, reflect on your weeks, and discover meaningful patterns through your
              activities.
            </p>
            <div className="flex flex-wrap justify-center gap-ds-16">
              <Link
                href="/dashboard"
                className="flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md bg-interactive-primary px-ds-24 text-label text-text-inverse transition-colors hover:bg-interactive-primary-hover"
              >
                Try InterLog
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how-it-works"
                className="flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md border border-border bg-surface px-ds-24 text-label text-text-primary transition-colors hover:bg-surface-hover"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-ds-20 text-body-sm text-text-muted">
              No account required. Start as a guest.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface-subtle py-ds-32">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-ds-24 px-ds-20 sm:flex-row sm:px-ds-32">
          <div className="flex items-center gap-ds-8 text-label font-[550] text-text-primary opacity-80">
            <Clock3 size={16} />
            InterLog
          </div>
          <p className="text-caption text-text-muted">
            Built with reflection, not productivity pressure.
          </p>
          <div className="flex items-center gap-ds-24 text-caption text-text-secondary">
            <a href="#" className="hover:text-text-primary">
              Features
            </a>
            <a href="#" className="hover:text-text-primary">
              Privacy
            </a>
            <a href="#" className="hover:text-text-primary">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
