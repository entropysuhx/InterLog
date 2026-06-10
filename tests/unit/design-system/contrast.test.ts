import { describe, expect, it } from "vitest";

import { darkTheme, focusTheme, lightTheme } from "@/design-system/themes";

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe.each([
  ["light", lightTheme],
  ["dark", darkTheme],
  ["focus", focusTheme],
] as const)("%s theme contrast", (_name, theme) => {
  it("keeps primary and secondary text readable", () => {
    expect(contrast(theme.textPrimary, theme.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(theme.textSecondary, theme.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps primary actions readable", () => {
    expect(contrast(theme.textInverse, theme.interactivePrimary)).toBeGreaterThanOrEqual(4.5);
  });
});
