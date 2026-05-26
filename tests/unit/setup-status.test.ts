import { describe, expect, it } from "vitest";

import { getEnvRows, getMissingEnvNames, REQUIRED_SUPABASE_PAGE_ENV_NAMES } from "@/lib/setup-status";

describe("setup status", () => {
  it("reports missing env names without exposing values", () => {
    const missing = getMissingEnvNames({
      OPENAI_API_KEY: "secret",
      NEXT_PUBLIC_SUPABASE_URL: ""
    });

    expect(missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(missing).not.toContain("OPENAI_API_KEY");
  });

  it("checks the minimal Supabase page requirements", () => {
    expect(
      getMissingEnvNames(
        {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co"
        },
        REQUIRED_SUPABASE_PAGE_ENV_NAMES
      )
    ).toEqual(["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
  });

  it("builds grouped rows for the setup page", () => {
    const groups = getEnvRows({ OPENAI_API_KEY: "configured" });

    expect(groups.some((group) => group.rows.some((row) => row.name === "OPENAI_API_KEY" && row.configured))).toBe(
      true
    );
  });
});
