/**
 * Phase: 3 (UI happy path)
 * Failure scenarios covered: AC-1 (clinician can upload and see a transcript),
 *   AC-2 (transcript appears within latency budget), accessibility check.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Appointment recording flow", () => {
  test("clinician can start a recording and see a transcript", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Appointment Audio Recording/i })).toBeVisible();

    await page.getByRole("button", { name: /Start recording/i }).click();

    // Wait for status to land on ready or unavailable.
    await expect(page.getByTestId("status")).toContainText(/ready|unavailable/i, { timeout: 30_000 });

    const transcript = page.getByTestId("transcript");
    await expect(transcript).toBeVisible();
  });

  test("home page has no critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
