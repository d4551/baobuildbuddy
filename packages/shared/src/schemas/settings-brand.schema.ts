import z from "zod";
import {
  BRAND_THEME_COLOR_PATTERN,
  BRAND_THEME_LENGTH_PATTERN,
  BRAND_THEME_UNITLESS_FLAG_PATTERN,
} from "../constants/brand-theme-css";
import { SCHEMA_MAX_LENGTH_LONG, SCHEMA_MAX_LENGTH_SHORT } from "../constants/schema-limits";

const brandThemeColorValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(SCHEMA_MAX_LENGTH_SHORT)
  .regex(BRAND_THEME_COLOR_PATTERN);

const brandThemeLengthValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(SCHEMA_MAX_LENGTH_SHORT)
  .regex(BRAND_THEME_LENGTH_PATTERN);

const brandThemeUnitlessFlagSchema = z
  .string()
  .trim()
  .min(1)
  .max(SCHEMA_MAX_LENGTH_SHORT)
  .regex(BRAND_THEME_UNITLESS_FLAG_PATTERN);

export const brandThemePaletteSchema = z.object({
  base100: brandThemeColorValueSchema,
  base200: brandThemeColorValueSchema,
  base300: brandThemeColorValueSchema,
  baseContent: brandThemeColorValueSchema,
  primary: brandThemeColorValueSchema,
  primaryContent: brandThemeColorValueSchema,
  secondary: brandThemeColorValueSchema,
  secondaryContent: brandThemeColorValueSchema,
  accent: brandThemeColorValueSchema,
  accentContent: brandThemeColorValueSchema,
  neutral: brandThemeColorValueSchema,
  neutralContent: brandThemeColorValueSchema,
  info: brandThemeColorValueSchema,
  infoContent: brandThemeColorValueSchema,
  success: brandThemeColorValueSchema,
  successContent: brandThemeColorValueSchema,
  warning: brandThemeColorValueSchema,
  warningContent: brandThemeColorValueSchema,
  error: brandThemeColorValueSchema,
  errorContent: brandThemeColorValueSchema,
  radiusSelector: brandThemeLengthValueSchema,
  radiusField: brandThemeLengthValueSchema,
  radiusBox: brandThemeLengthValueSchema,
  sizeSelector: brandThemeLengthValueSchema,
  sizeField: brandThemeLengthValueSchema,
  border: brandThemeLengthValueSchema,
  depth: brandThemeUnitlessFlagSchema,
  noise: brandThemeUnitlessFlagSchema,
});

export const brandTypographySettingsSchema = z.object({
  fontStylesheetUrl: z.string().trim().max(SCHEMA_MAX_LENGTH_LONG).default(""),
  displayFontFamily: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  bodyFontFamily: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  monoFontFamily: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
});

export const brandContentSettingsSchema = z.object({
  tagline: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  defaultTitle: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  defaultDescription: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  contentOverrides: z
    .record(
      z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
      z.string().trim().max(SCHEMA_MAX_LENGTH_LONG),
    )
    .default({}),
});

export const brandSettingsSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  assistantName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  apiName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  logoPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  faviconPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG),
  typography: brandTypographySettingsSchema,
  lightTheme: brandThemePaletteSchema,
  darkTheme: brandThemePaletteSchema,
  content: brandContentSettingsSchema,
});

export const brandThemePalettePatchSchema = brandThemePaletteSchema.partial();
export const brandTypographySettingsPatchSchema = brandTypographySettingsSchema.partial();
export const brandContentSettingsPatchSchema = brandContentSettingsSchema.partial();
export const brandSettingsPatchSchema = z.object({
  name: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  assistantName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  apiName: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  logoPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
  faviconPath: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_LONG).optional(),
  typography: brandTypographySettingsPatchSchema.optional(),
  lightTheme: brandThemePalettePatchSchema.optional(),
  darkTheme: brandThemePalettePatchSchema.optional(),
  content: brandContentSettingsPatchSchema.optional(),
});
