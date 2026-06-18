import { fireEvent, screen } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InsightCard from "@/components/insight/InsightCard";

vi.mock("@/actions/insight", () => ({
  dismissInsight: vi.fn(),
  recordInsightFeedback: vi.fn(),
}));

describe("InsightCard", () => {
  it("shows evidence through a keyboard-accessible disclosure", () => {
    render(
      <InsightCard
        confidence="emerging"
        observation="Morning sessions were longer."
        interpretation="This may be an early timing pattern."
        evidence="Across 3 sessions in the last 14 days."
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Why am I seeing this?" }));
    expect(screen.getByText("Across 3 sessions in the last 14 days.")).toBeVisible();
  });

  it("acknowledges feedback without removing the card", () => {
    render(
      <InsightCard
        confidence="consistent"
        observation="Focus happened before noon."
        interpretation="Morning may be a useful focus window."
        evidence="Across 5 sessions."
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    expect(screen.getByText("Thanks for the feedback.")).toBeVisible();
  });
});
