export const spacing = {
  2: "0.125rem",
  4: "0.25rem",
  8: "0.5rem",
  12: "0.75rem",
  16: "1rem",
  20: "1.25rem",
  24: "1.5rem",
  32: "2rem",
  40: "2.5rem",
  48: "3rem",
  64: "4rem",
  80: "5rem",
  96: "6rem",
} as const;

export type SpacingToken = keyof typeof spacing;

