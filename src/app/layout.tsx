import { Manrope } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/design-system/styles.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "InterLog", template: "%s · InterLog" },
  description: "A calm productivity timeline and reflection app.",
};

const themeScript = `
try {
  const stored = localStorage.getItem("interlog:theme");
  document.documentElement.dataset.theme =
    stored === "dark" || stored === "focus" ? stored : "light";
} catch {}
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
