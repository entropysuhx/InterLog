export const primary = {
  50: "#f2f1ff",
  100: "#e8e5ff",
  200: "#d3ceff",
  300: "#b5a9ff",
  400: "#9278ff",
  500: "#7047f5",
  600: "#5b2fe0",
  700: "#4823b8",
  800: "#3c2195",
  900: "#331f78",
  950: "#1d104f",
} as const;

export const neutral = {
  50: "#f8f9fb",
  100: "#f1f3f6",
  200: "#e4e7ec",
  300: "#d0d5dd",
  400: "#98a2b3",
  500: "#667085",
  600: "#475467",
  700: "#344054",
  800: "#1d2939",
  900: "#101828",
  950: "#0b0f19",
} as const;

export const success = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
  950: "#022c22",
} as const;

export const warning = {
  50: "#fffbeb",
  100: "#fef3c7",
  200: "#fde68a",
  300: "#fcd34d",
  400: "#fbbf24",
  500: "#f59e0b",
  600: "#d97706",
  700: "#b45309",
  800: "#92400e",
  900: "#78350f",
  950: "#451a03",
} as const;

export const error = {
  50: "#fff1f2",
  100: "#ffe4e6",
  200: "#fecdd3",
  300: "#fda4af",
  400: "#fb7185",
  500: "#f43f5e",
  600: "#e11d48",
  700: "#be123c",
  800: "#9f1239",
  900: "#881337",
  950: "#4c0519",
} as const;

export const info = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
  950: "#172554",
} as const;

export const activityColors = {
  deepWork: {
    background: "#e6f7f5",
    border: "#9ddfd8",
    icon: "#087f78",
    chart: "#0f9f94",
  },
  learning: {
    background: "#f0ebff",
    border: "#cbbcff",
    icon: "#6941c6",
    chart: "#805ad5",
  },
  reflection: {
    background: "#f5edff",
    border: "#dcc3fa",
    icon: "#7e3faf",
    chart: "#9b51c8",
  },
  exercise: {
    background: "#fff0ed",
    border: "#ffc3b6",
    icon: "#d9452f",
    chart: "#f06449",
  },
  social: {
    background: "#eef2ff",
    border: "#c7d2fe",
    icon: "#4f46e5",
    chart: "#6366f1",
  },
  meeting: {
    background: "#eaf5ff",
    border: "#b6dcfa",
    icon: "#1476b8",
    chart: "#2496d8",
  },
  admin: {
    background: "#f2f4f7",
    border: "#d0d5dd",
    icon: "#475467",
    chart: "#667085",
  },
  break: {
    background: "#fff8df",
    border: "#f5da85",
    icon: "#a66b08",
    chart: "#d69e16",
  },
  personal: {
    background: "#ffedf5",
    border: "#f5bfd5",
    icon: "#c13f77",
    chart: "#db5f91",
  },
} as const;

export const colors = {
  primary,
  neutral,
  success,
  warning,
  error,
  info,
  activity: activityColors,
} as const;

export type ActivityCategory = keyof typeof activityColors;
export type ColorScale = Record<keyof typeof primary, string>;

