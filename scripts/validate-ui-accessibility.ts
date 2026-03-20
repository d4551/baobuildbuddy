import { join } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

type OklchColor = {
  lightnessPercent: number;
  chroma: number;
  hueDegrees: number;
};

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const themeFilePath = `${clientRoot}/assets/css/main.css`;
const daisyThemesPath = join(projectRoot, clientRoot, "node_modules", "daisyui", "themes.css");

/**
 * Must match `@plugin "daisyui" { themes: … }` in `main.css` (default light + prefers-dark).
 */
const CONFIGURED_DAISY_THEMES = [
  { name: "corporate", role: "light default" as const },
  { name: "business", role: "dark prefers-dark" as const },
] as const;

const textContrastMinimum = 4.5;
const hardcodedColorLiteralPattern =
  /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\(/gu;
const hardcodedPaletteClassPattern =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/gu;
const hardcodedArbitraryColorClassPattern =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-\[(?:#|rgb|hsl|oklch|oklab|color)[^\]]+\]/gu;

/** daisyUI theme blocks use `--color-*: oklch(L% C H)` (optional space after `:`). */
const daisyColorTokenPattern =
  /--color-([a-z0-9-]+):\s*oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)\s*\)/gu;

const allowedColorLiteralFiles = new Set([themeFilePath]);
const scannedExtensions = new Set([".vue", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".css"]);
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);

const contrastPairs: Array<readonly [string, string]> = [
  ["base-100", "base-content"],
  ["base-200", "base-content"],
  ["base-300", "base-content"],
  ["primary", "primary-content"],
  ["secondary", "secondary-content"],
  ["accent", "accent-content"],
  ["neutral", "neutral-content"],
  ["info", "info-content"],
  ["success", "success-content"],
  ["warning", "warning-content"],
  ["error", "error-content"],
];

const hasScannedExtension = (pathValue: string): boolean => {
  const normalizedPath = pathValue.toLowerCase();
  for (const extension of scannedExtensions) {
    if (normalizedPath.endsWith(extension)) {
      return true;
    }
  }
  return false;
};

const shouldIgnorePath = (pathValue: string): boolean =>
  pathValue.split("/").some((segment) => ignoredDirectoryNames.has(segment));

const collectScannableFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/**/*`);

  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (!hasScannedExtension(normalizedPath) || shouldIgnorePath(normalizedPath)) {
      continue;
    }
    files.push(normalizedPath);
  }

  return files;
};

const getLineFromOffset = (text: string, offset: number): number => {
  if (offset <= 0) {
    return 1;
  }

  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }

  return line;
};

const clamp01 = (value: number): number => {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const oklchToRelativeLuminance = (color: OklchColor): number => {
  const l = color.lightnessPercent / 100;
  const hueRadians = (color.hueDegrees * Math.PI) / 180;
  const a = color.chroma * Math.cos(hueRadians);
  const b = color.chroma * Math.sin(hueRadians);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const lCube = lPrime ** 3;
  const mCube = mPrime ** 3;
  const sCube = sPrime ** 3;

  const redLinear = clamp01(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube);
  const greenLinear = clamp01(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube);
  const blueLinear = clamp01(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube);

  return 0.2126 * redLinear + 0.7152 * greenLinear + 0.0722 * blueLinear;
};

const getContrastRatio = (firstColor: OklchColor, secondColor: OklchColor): number => {
  const first = oklchToRelativeLuminance(firstColor);
  const second = oklchToRelativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
};

const buildDataThemeBlockPattern = (themeName: string): RegExp => {
  if (!/^[a-z0-9-]+$/u.test(themeName)) {
    return /$^/u;
  }
  return new RegExp(
    `\\[data-theme=["']?${themeName}["']?\\][^{]*\\{([^}]+)\\}`,
    "u",
  );
};

const extractDaisyThemeDeclarations = (themesCss: string, themeName: string): string | null => {
  const match = themesCss.match(buildDataThemeBlockPattern(themeName));
  return match?.[1] ?? null;
};

const parseDaisyThemeColorMap = (declarations: string): Map<string, OklchColor> => {
  const map = new Map<string, OklchColor>();
  daisyColorTokenPattern.lastIndex = 0;
  for (const match of declarations.matchAll(daisyColorTokenPattern)) {
    const token = match[1];
    const lightnessPercent = Number.parseFloat(match[2]);
    const chroma = Number.parseFloat(match[3]);
    const hueDegrees = Number.parseFloat(match[4]);
    if (Number.isNaN(lightnessPercent) || Number.isNaN(chroma) || Number.isNaN(hueDegrees)) {
      continue;
    }
    map.set(token, { lightnessPercent, chroma, hueDegrees });
  }
  return map;
};

const assertMainCssMatchesConfiguredThemes = (mainCss: string): string | null => {
  if (!mainCss.includes('@plugin "daisyui"')) {
    return "packages/client/assets/css/main.css must use @plugin \"daisyui\" for theme contrast validation.";
  }
  for (const { name } of CONFIGURED_DAISY_THEMES) {
    if (!mainCss.includes(name)) {
      return `main.css is missing daisyUI theme name "${name}"; update CONFIGURED_DAISY_THEMES or main.css so they stay aligned.`;
    }
  }
  return null;
};

const collectHardcodedColorViolations = async (): Promise<Violation[]> => {
  const files = await collectScannableFiles();
  const patterns = [
    {
      regex: hardcodedColorLiteralPattern,
      message: "Hardcoded color literal found. Use daisyUI semantic classes or theme tokens.",
    },
    {
      regex: hardcodedPaletteClassPattern,
      message:
        "Tailwind palette class found. Use daisyUI semantic color classes for theme consistency.",
    },
    {
      regex: hardcodedArbitraryColorClassPattern,
      message: "Arbitrary color class found. Use semantic tokens instead of inline color literals.",
    },
  ];

  const violationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      const fileViolations: Violation[] = [];

      for (const pattern of patterns) {
        pattern.regex.lastIndex = 0;
        for (const match of fileContent.matchAll(pattern.regex)) {
          if (allowedColorLiteralFiles.has(filePath)) {
            continue;
          }

          fileViolations.push({
            filePath,
            line: getLineFromOffset(fileContent, match.index ?? 0),
            message: pattern.message,
          });
        }
      }

      return fileViolations;
    }),
  );

  return violationGroups.flat();
};

const mergeColorMaps = (
  base: Map<string, OklchColor>,
  overrides: Map<string, OklchColor>,
): Map<string, OklchColor> => {
  const merged = new Map(base);
  for (const [key, value] of overrides) {
    merged.set(key, value);
  }
  return merged;
};

const extractMainThemeOverrides = (mainCss: string, themeName: string): Map<string, OklchColor> => {
  const match = mainCss.match(buildDataThemeBlockPattern(themeName));
  if (!match?.[1]) {
    return new Map();
  }
  return parseDaisyThemeColorMap(match[1]);
};

const collectContrastViolations = (themesCss: string, mainCss: string): string[] => {
  const failures: string[] = [];

  for (const { name, role } of CONFIGURED_DAISY_THEMES) {
    const block = extractDaisyThemeDeclarations(themesCss, name);
    if (!block) {
      failures.push(`Missing daisyUI [data-theme=${name}] block in themes.css (${role}).`);
      continue;
    }

    const colors = mergeColorMaps(
      parseDaisyThemeColorMap(block),
      extractMainThemeOverrides(mainCss, name),
    );
    for (const [backgroundToken, contentToken] of contrastPairs) {
      const background = colors.get(backgroundToken);
      const content = colors.get(contentToken);

      if (!(background && content)) {
        failures.push(
          `Missing token pair: theme=${name} --color-${backgroundToken} / --color-${contentToken}`,
        );
        continue;
      }

      const ratio = getContrastRatio(background, content);
      if (ratio < textContrastMinimum) {
        failures.push(
          `Contrast below ${textContrastMinimum.toFixed(1)}: theme=${name} ${backgroundToken} vs ${contentToken} = ${ratio.toFixed(2)}`,
        );
      }
    }
  }

  return failures;
};

const main = async (): Promise<void> => {
  const mainCssText = await Bun.file(themeFilePath).text();
  const mainCssMismatch = assertMainCssMatchesConfiguredThemes(mainCssText);
  if (mainCssMismatch) {
    await writeError(mainCssMismatch);
    process.exit(1);
  }

  const daisyThemesFile = Bun.file(daisyThemesPath);
  if (!(await daisyThemesFile.exists())) {
    await writeError(
      `Missing daisyUI themes.css at ${daisyThemesPath}. Run bun install in packages/client.`,
    );
    process.exit(1);
  }

  const themesCss = await daisyThemesFile.text();
  const hardcodedColorViolations = await collectHardcodedColorViolations();
  const contrastViolations = collectContrastViolations(themesCss, mainCssText);

  if (hardcodedColorViolations.length === 0 && contrastViolations.length === 0) {
    await writeOutput(
      "UI accessibility validation passed: WCAG contrast (daisyUI corporate/business) and tokenized colors are enforced.",
    );
    return;
  }

  if (hardcodedColorViolations.length > 0) {
    await writeError("\nHardcoded color violations:");
    const lines = hardcodedColorViolations.map(
      (violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`,
    );
    if (lines.length > 0) {
      await writeError(lines.join("\n"));
    }
  }

  if (contrastViolations.length > 0) {
    await writeError("\nWCAG contrast violations:");
    const lines = contrastViolations.map((violation) => `- ${violation}`);
    if (lines.length > 0) {
      await writeError(lines.join("\n"));
    }
  }

  process.exit(1);
};

await main();
