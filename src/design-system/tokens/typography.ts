export const fontFamily = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const typography = {
  displayXl: { fontSize: "4.5rem", fontWeight: 650, lineHeight: 1.05, letterSpacing: "-0.04em" },
  displayL: { fontSize: "3.75rem", fontWeight: 650, lineHeight: 1.08, letterSpacing: "-0.035em" },
  displayM: { fontSize: "3rem", fontWeight: 650, lineHeight: 1.1, letterSpacing: "-0.03em" },
  h1: { fontSize: "2.25rem", fontWeight: 650, lineHeight: 1.2, letterSpacing: "-0.025em" },
  h2: { fontSize: "1.875rem", fontWeight: 650, lineHeight: 1.25, letterSpacing: "-0.02em" },
  h3: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.015em" },
  h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.01em" },
  bodyLarge: { fontSize: "1.125rem", fontWeight: 400, lineHeight: 1.6, letterSpacing: "-0.005em" },
  bodyMedium: { fontSize: "1rem", fontWeight: 400, lineHeight: 1.5, letterSpacing: "0" },
  bodySmall: { fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5, letterSpacing: "0" },
  label: { fontSize: "0.875rem", fontWeight: 550, lineHeight: 1.25, letterSpacing: "0.005em" },
  caption: { fontSize: "0.75rem", fontWeight: 450, lineHeight: 1.4, letterSpacing: "0.01em" },
} as const;

export type TypographyToken = keyof typeof typography;

