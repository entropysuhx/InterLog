export const motion = {
  duration: {
    instant: "0ms",
    fast: "120ms",
    normal: "180ms",
    slow: "280ms",
    deliberate: "420ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
} as const;

