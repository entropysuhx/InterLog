import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimitEvent = vi.hoisted(() => ({
  create: vi.fn(),
  deleteMany: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { rateLimitEvent } }));

import { consumeRateLimit, getRateLimitStatus } from "@/lib/rate-limit";

describe("rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("locks after the configured number of failed login attempts", async () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    rateLimitEvent.findFirst.mockResolvedValue({ count: 5, expiresAt });

    const result = await getRateLimitStatus("person@example.com", "login", 5, 15 * 60);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("starts a rolling window when there is no active rate-limit event", async () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    rateLimitEvent.findFirst.mockResolvedValue(null);
    rateLimitEvent.create.mockResolvedValue({ count: 1, expiresAt });

    const result = await consumeRateLimit("person@example.com", "login", 5, 15 * 60);

    expect(rateLimitEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          key: "person@example.com",
          action: "login",
          count: 1,
        }),
      }),
    );
    expect(result.allowed).toBe(true);
  });
});
