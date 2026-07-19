import { describe, expect, test } from "bun:test";
import { DEFAULT_BRAND_DARK_THEME, DEFAULT_BRAND_LIGHT_THEME } from "../constants/branding";
import { brandThemePaletteSchema } from "./settings.schema";

describe("brandThemePaletteSchema", () => {
  test("accepts canonical default light and dark brand palettes", () => {
    expect(brandThemePaletteSchema.parse(DEFAULT_BRAND_LIGHT_THEME)).toEqual(
      DEFAULT_BRAND_LIGHT_THEME,
    );
    expect(brandThemePaletteSchema.parse(DEFAULT_BRAND_DARK_THEME)).toEqual(
      DEFAULT_BRAND_DARK_THEME,
    );
  });

  test("rejects arbitrary CSS color strings", () => {
    const result = brandThemePaletteSchema.safeParse({
      ...DEFAULT_BRAND_LIGHT_THEME,
      primary: "#3366ff",
    });
    expect(result.success).toBe(false);
  });

  test("rejects non-length radius values", () => {
    const result = brandThemePaletteSchema.safeParse({
      ...DEFAULT_BRAND_LIGHT_THEME,
      radiusBox: "large",
    });
    expect(result.success).toBe(false);
  });

  test("rejects non-flag depth values", () => {
    const result = brandThemePaletteSchema.safeParse({
      ...DEFAULT_BRAND_LIGHT_THEME,
      depth: "2",
    });
    expect(result.success).toBe(false);
  });
});
