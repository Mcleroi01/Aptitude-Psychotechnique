import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/redirects";

describe("safeCallbackUrl", () => {
  it("accepte un chemin interne", () => {
    expect(safeCallbackUrl("/espace/examens?id=1")).toBe("/espace/examens?id=1");
  });

  it.each(["https://malveillant.example", "//malveillant.example", "/\malveillant.example", "", undefined, 42])(
    "refuse %s et revient à /espace",
    (value) => {
      expect(safeCallbackUrl(value)).toBe("/espace");
    },
  );
});
