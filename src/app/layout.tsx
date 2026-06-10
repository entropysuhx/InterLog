import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/design-system/styles.css";

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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
