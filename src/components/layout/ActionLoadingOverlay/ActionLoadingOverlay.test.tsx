import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ActionLoadingOverlay from "@/components/layout/ActionLoadingOverlay";

describe("ActionLoadingOverlay", () => {
  it("announces the current action and supporting copy", () => {
    render(
      <ActionLoadingOverlay
        title="Importing your data..."
        subtitle="This may take a few seconds."
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { name: "Importing your data..." })).toBeVisible();
    expect(screen.getByText("This may take a few seconds.")).toBeVisible();
  });
});
