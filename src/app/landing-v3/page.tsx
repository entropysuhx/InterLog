"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Layers3,
  NotebookPen,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

import {
  MockInsightCard,
  MockInsightsChartCard,
  MockPatternCard,
  MockReflectionJournalCard,
  MockTimelineCard,
  MockWeekLetterCard,
} from "@/components/landing/MockUI";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const footerColumns = [
  { heading: "Product", links: ["Features", "How It Works", "Pricing"] },
  { heading: "Company", links: ["About", "Privacy", "Contact"] },
  { heading: "Resources", links: ["AI Insights", "Reflection", "Guest Mode"] },
];

function DotField({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute text-interactive-primary/20 ${className}`}
      viewBox="0 0 160 120"
      aria-hidden="true"
    >
      {Array.from({ length: 48 }).map((_, index) => {
        const x = (index % 8) * 20 + 8;
        const y = Math.floor(index / 8) * 20 + 8;
        return <circle key={index} cx={x} cy={y} r="1.5" fill="currentColor" />;
      })}
    </svg>
  );
}

function SparkleMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute text-status-warning/70 ${className}`}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M24 4c2.4 9.2 5.8 12.6 15 15-9.2 2.4-12.6 5.8-15 15-2.4-9.2-5.8-12.6-15-15 9.2-2.4 12.6-5.8 15-15Z"
        fill="currentColor"
      />
      <path
        d="M38 31c1.2 4.4 2.8 6 7.2 7.2-4.4 1.2-6 2.8-7.2 7.2-1.2-4.4-2.8-6-7.2-7.2 4.4-1.2 6-2.8 7.2-7.2Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

function AppFrame({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              scale: 1.015,
              rotateX: 1,
              rotateY: -1,
            }
      }
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full max-w-full overflow-hidden rounded-2xl border border-border bg-surface-elevated/95 p-ds-8 shadow-xl sm:p-ds-12 ${className}`}
    >
      <div className="mb-ds-12 flex items-center justify-between gap-ds-16 rounded-lg border border-border bg-surface-subtle px-ds-12 py-ds-8">
        <div className="flex items-center gap-ds-4" aria-hidden="true">
          <span className="size-ds-8 rounded-full bg-status-error" />
          <span className="size-ds-8 rounded-full bg-status-warning" />
          <span className="size-ds-8 rounded-full bg-status-success" />
        </div>
        <p className="truncate text-caption text-text-muted">{label}</p>
        <span className="size-ds-24" aria-hidden="true" />
      </div>
      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-background p-ds-12 sm:p-ds-16">{children}</div>
    </motion.div>
  );
}

function MotionSection({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function FeatureSpotlight({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  reverse,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const panelY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [24, -24]);

  return (
    <div ref={ref} className="grid gap-ds-40 lg:grid-cols-2 lg:items-center">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className={`flex flex-col items-center text-center lg:items-start lg:text-left ${reverse ? "lg:order-2" : ""}`}
      >
        <div className="flex size-ds-48 items-center justify-center rounded-xl border border-border bg-surface text-interactive-primary shadow-sm">
          <Icon size={22} aria-hidden="true" />
        </div>
        <p className="mt-ds-20 text-label font-[550] text-interactive-primary">{eyebrow}</p>
        <h3 className="mt-ds-8 text-heading-3 font-[650] text-text-primary sm:text-heading-2">{title}</h3>
        <p className="mt-ds-16 max-w-reading text-body-lg leading-relaxed text-text-secondary">
          {description}
        </p>
      </motion.div>
      <motion.div style={{ y: panelY }} className={`w-full max-w-full min-w-0 ${reverse ? "lg:order-1" : ""}`}>
        {children}
      </motion.div>
    </div>
  );
}

export default function LandingV3Page() {
  const heroRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroDecorY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, 110]);
  const heroPanelY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -36]);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-text-primary selection:bg-interactive-primary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-ds-20 py-ds-16 sm:px-ds-32">
          <Link href="/" className="flex items-center gap-ds-8 text-heading-4 font-semibold leading-none">
            <Image src="/interlog.svg" alt="" width={30} height={27} className="block h-ds-24 w-auto shrink-0" />
            <span className="leading-none">InterLog</span>
          </Link>
          <nav className="hidden items-center gap-ds-24 text-label text-text-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-text-primary">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-text-primary">
              How It Works
            </a>
            <a href="#ai-showcase" className="transition-colors hover:text-text-primary">
              AI
            </a>
          </nav>
          <Link
            href="/dashboard"
            className="group inline-flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md bg-interactive-primary px-ds-16 text-label text-text-inverse transition-transform hover:-translate-y-ds-2 hover:bg-interactive-primary-hover"
          >
            Go to App
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-ds-2"
              aria-hidden="true"
            />
          </Link>
        </div>
      </header>

      <main>
        <section
          ref={heroRef}
          className="relative mx-auto max-w-7xl px-ds-20 pb-ds-64 pt-ds-64 sm:px-ds-32 sm:pb-ds-96 sm:pt-ds-80"
        >
          <motion.div
            style={{ y: heroDecorY }}
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
          >
            <div className="absolute left-1/2 top-ds-24 size-ds-96 -translate-x-1/2 rounded-full bg-interactive-primary/10 blur-3xl" />
            <div className="absolute right-ds-24 top-ds-64 size-ds-80 rounded-full bg-status-info/10 blur-3xl" />
            <div className="absolute left-ds-24 top-ds-80 size-ds-64 rounded-full bg-status-warning/10 blur-3xl" />
            <DotField className="right-ds-24 top-ds-48 h-ds-96 w-ds-96" />
            <SparkleMark className="left-ds-32 top-ds-96 size-ds-40" />
            <SparkleMark className="right-ds-64 top-ds-80 size-ds-24 text-interactive-primary/40" />
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mx-auto flex max-w-4xl flex-col items-center text-center"
          >
            <motion.p
              variants={reveal}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="rounded-full border border-border bg-surface px-ds-16 py-ds-8 text-label text-text-secondary shadow-sm"
            >
              Reflection-first time tracking
            </motion.p>
            <motion.h1
              variants={reveal}
              transition={{ duration: 0.46, ease: "easeOut" }}
              className="mt-ds-24 text-heading-2 font-[650] leading-tight text-text-primary sm:text-heading-1"
            >
              Understand{" "}
              <span className="bg-gradient-to-r from-interactive-primary via-status-info to-interactive-primary bg-clip-text text-transparent">
                Where Your Time Really Goes
              </span>
              .
            </motion.h1>
            <motion.p
              variants={reveal}
              transition={{ duration: 0.46, ease: "easeOut" }}
              className="mt-ds-20 max-w-reading text-body-lg leading-relaxed text-text-secondary"
            >
              Track your days, reflect on your weeks, and uncover meaningful patterns with
              AI-powered insights. Built with reflection, not productivity pressure.
            </motion.p>
            <motion.div variants={reveal} className="mt-ds-32 flex flex-wrap justify-center gap-ds-16">
              <Link
                href="/dashboard"
                className="group flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md bg-gradient-to-r from-interactive-primary to-status-info px-ds-24 text-label text-text-inverse shadow-md transition-transform hover:-translate-y-ds-2 hover:shadow-lg"
              >
                Try InterLog
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-ds-2"
                  aria-hidden="true"
                />
              </Link>
              <a
                href="#how-it-works"
                className="flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md border border-border bg-surface px-ds-24 text-label text-text-primary shadow-sm transition-transform hover:-translate-y-ds-2 hover:bg-surface-hover"
              >
                See How It Works
              </a>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: heroPanelY }} className="mx-auto mt-ds-48 w-full max-w-5xl min-w-0">
            <AppFrame label="interlog.app/dashboard" className="bg-gradient-to-br from-surface-elevated to-surface">
              <div className="grid gap-ds-16 lg:grid-cols-[1fr_0.9fr]">
                <div className="space-y-ds-12">
                  <MockTimelineCard />
                  <MockTimelineCard />
                  <MockTimelineCard />
                </div>
                <div className="grid gap-ds-12">
                  <MockPatternCard />
                  <MockReflectionJournalCard />
                </div>
              </div>
            </AppFrame>
          </motion.div>
        </section>

        <MotionSection className="relative border-y border-border bg-surface py-ds-64 sm:py-ds-96">
          <DotField className="left-ds-24 top-ds-24 h-ds-80 w-ds-96" />
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
        </MotionSection>

        <section
          id="features"
          className="relative mx-auto grid max-w-7xl gap-ds-80 px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96"
        >
          <div className="pointer-events-none absolute inset-x-0 top-ds-32 -z-10 h-ds-96 rounded-2xl bg-interactive-primary/5" />
          <FeatureSpotlight
            eyebrow="Timeline"
            title="See your day unfold hour by hour."
            description="Track work, learning, exercise, meetings, and personal moments in one calm view."
            icon={Clock3}
          >
            <AppFrame label="Timeline view">
              <div className="space-y-ds-12">
                <MockTimelineCard />
                <MockTimelineCard />
                <MockTimelineCard />
              </div>
            </AppFrame>
          </FeatureSpotlight>

          <FeatureSpotlight
            eyebrow="Reflection"
            title="Build a personal history you can revisit."
            description="Capture thoughts, lessons, and wins from each day without turning reflection into another task."
            icon={NotebookPen}
            reverse
          >
            <AppFrame label="Reflection journal">
              <MockReflectionJournalCard />
            </AppFrame>
          </FeatureSpotlight>

          <FeatureSpotlight
            eyebrow="Insights"
            title="Discover patterns across days, weeks, and months."
            description="InterLog helps patterns emerge from timing, categories, and activity rhythm without turning your life into a score."
            icon={BarChart3}
          >
            <AppFrame label="Analytics and insights">
              <MockInsightsChartCard />
            </AppFrame>
          </FeatureSpotlight>

          <FeatureSpotlight
            eyebrow="AI Reflection"
            title="Turn activity logs into gentle observations."
            description={'Generate supportive insights like "One Thing Worth Noticing" from your time logs, with reflection before optimization.'}
            icon={Sparkles}
            reverse
          >
            <AppFrame label="AI reflection stack">
              <div className="grid gap-ds-12">
                <MockInsightCard type="reflection" />
                <MockPatternCard />
                <MockWeekLetterCard />
              </div>
            </AppFrame>
          </FeatureSpotlight>
        </section>

        <MotionSection
          id="how-it-works"
          className="relative border-y border-border bg-interactive-primary/5 py-ds-64 sm:py-ds-96"
        >
          <SparkleMark className="right-ds-40 top-ds-32 size-ds-32" />
          <div className="mx-auto max-w-7xl px-ds-20 sm:px-ds-32">
            <div className="mx-auto max-w-reading text-center">
              <h2 className="text-heading-2 font-[650] text-text-primary">How It Works</h2>
              <p className="mt-ds-12 text-body-lg text-text-secondary">
                A simple loop for noticing your time as it happens.
              </p>
            </div>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-ds-48 grid gap-ds-24 sm:grid-cols-2 lg:grid-cols-4"
            >
              {[
                ["1", "Track your time", "Log activities quickly without complex forms."],
                ["2", "Reflect on your day", "Add a simple sentence about what mattered."],
                ["3", "Discover patterns", "See your natural rhythms emerge over time."],
                ["4", "Generate AI insights", "Let AI synthesize your logs into a supportive narrative."],
              ].map(([step, title, desc]) => (
                <motion.article
                  key={step}
                  variants={reveal}
                  whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                  className="rounded-xl border border-border bg-background p-ds-24 text-center shadow-sm transition-colors hover:border-border-hover hover:bg-surface-hover"
                >
                  <span className="mx-auto flex size-ds-48 items-center justify-center rounded-full border-2 border-border-active bg-surface text-heading-4 font-semibold text-interactive-primary">
                    {step}
                  </span>
                  <h3 className="mt-ds-16 text-label font-[550] text-text-primary">{title}</h3>
                  <p className="mt-ds-4 text-body-sm text-text-secondary">{desc}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </MotionSection>

        <MotionSection
          id="ai-showcase"
          className="mx-auto max-w-7xl px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96"
        >
          <div className="mb-ds-48 text-center">
            <h2 className="text-heading-2 font-[650] text-text-primary">Your Time Has a Story.</h2>
            <p className="mt-ds-12 text-body-lg text-text-secondary">
              Our AI doesn&rsquo;t score you. It notices the patterns you might miss.
            </p>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto grid max-w-5xl gap-ds-24 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[<MockInsightCard key="reflection" type="reflection" />, <MockPatternCard key="pattern" />, <MockWeekLetterCard key="letter" />].map(
              (card, index) => (
                <motion.div
                  key={index}
                  variants={reveal}
                  whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
                  className="rounded-xl"
                >
                  {card}
                </motion.div>
              ),
            )}
          </motion.div>
        </MotionSection>

        <MotionSection className="border-y border-border bg-interactive-primary/5 py-ds-64 sm:py-ds-96">
          <div className="mx-auto max-w-reading px-ds-20 text-center sm:px-ds-32">
            <Layers3 size={28} className="mx-auto text-interactive-primary" aria-hidden="true" />
            <p className="mt-ds-20 text-heading-3 font-semibold italic text-text-primary">
              &ldquo;Built for students, creators, freelancers, and lifelong learners.&rdquo;
            </p>
          </div>
        </MotionSection>

        <MotionSection className="relative mx-auto max-w-7xl px-ds-20 py-ds-64 sm:px-ds-32 sm:py-ds-96">
          <div className="pointer-events-none absolute inset-x-ds-20 top-ds-40 -z-10 h-ds-96 rounded-2xl bg-gradient-to-r from-interactive-primary/10 via-status-info/10 to-status-warning/10 blur-3xl" />
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-2xl border border-border bg-surface/95 p-ds-32 text-center shadow-xl sm:p-ds-48">
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
                className="group flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md bg-gradient-to-r from-interactive-primary to-status-info px-ds-24 text-label text-text-inverse shadow-md transition-transform hover:-translate-y-ds-2 hover:shadow-lg"
              >
                Try InterLog
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-ds-2"
                  aria-hidden="true"
                />
              </Link>
              <a
                href="#how-it-works"
                className="flex min-h-touch-target items-center justify-center gap-ds-8 rounded-md border border-border bg-background px-ds-24 text-label text-text-primary transition-transform hover:-translate-y-ds-2 hover:bg-surface-hover"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-ds-20 text-body-sm text-text-muted">
              No account required. Start as a guest.
            </p>
          </div>
        </MotionSection>
      </main>

      <footer className="border-t border-border bg-surface-subtle py-ds-48">
          <div className="mx-auto grid max-w-7xl gap-ds-32 px-ds-20 text-center sm:px-ds-32 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center justify-center gap-ds-8 text-heading-4 font-semibold leading-none md:justify-start">
              <Image src="/interlog.svg" alt="" width={30} height={27} className="block h-ds-24 w-auto shrink-0" />
              <span className="leading-none">InterLog</span>
            </Link>
            <p className="mt-ds-12 max-w-xs text-body-sm text-text-secondary">
              Track your days, reflect on your weeks, and notice meaningful patterns without
              productivity pressure.
            </p>
          </div>
          {footerColumns.map(({ heading, links }) => (
            <div key={heading} className="text-center md:text-left">
              <h3 className="text-label font-[550] text-text-primary">{heading}</h3>
              <ul className="mt-ds-12 space-y-ds-8 text-body-sm text-text-secondary">
                {links.map((item) => (
                  <li key={item}>
                    <a href="#features" className="transition-colors hover:text-interactive-primary">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-ds-40 flex max-w-7xl flex-col gap-ds-12 border-t border-border px-ds-20 pt-ds-20 text-center text-caption text-text-muted sm:px-ds-32 md:flex-row md:items-center md:justify-between md:text-left">
          <p>(c) 2026 InterLog. All rights reserved.</p>
          <p>Built with reflection, not productivity pressure.</p>
        </div>
      </footer>
    </div>
  );
}
