type OklchColor = {
  lightnessPercent: number;
  chroma: number;
  hueDegrees: number;
};

type ThemeMode = "light" | "dark";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const themeFilePath = `${clientRoot}/assets/css/main.css`;

const textContrastMinimum = 4.5;
const hardcodedColorLiteralPattern =
  /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|color)\(/gu;
const hardcodedPaletteClassPattern =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/gu;
const hardcodedArbitraryColorClassPattern =
  /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-\[(?:#|rgb|hsl|oklch|oklab|color)[^\]]+\]/gu;

const tokenPattern =
  /--bao-(light|dark)-([a-z0-9-]+):\s*oklch\(\s*([0-9.]+)%\s+([0-9.]+)\s+([0-9.]+)\s*\)\s*;/gu;

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

const getThemeColors = (css: string): Record<ThemeMode, Map<string, OklchColor>> => {
  const themes: Record<ThemeMode, Map<string, OklchColor>> = {
    light: new Map<string, OklchColor>(),
    dark: new Map<string, OklchColor>(),
  };

  for (const match of css.matchAll(tokenPattern)) {
    const mode = match[1];
    const token = match[2];
    const lightnessPercent = Number.parseFloat(match[3]);
    const chroma = Number.parseFloat(match[4]);
    const hueDegrees = Number.parseFloat(match[5]);

    if ((mode !== "light" && mode !== "dark") || Number.isNaN(lightnessPercent)) {
      continue;
    }

    themes[mode].set(token, {
      lightnessPercent,
      chroma,
      hueDegrees,
    });
  }

  return themes;
};

const collectHardcodedColorViolations = async (): Promise<Violation[]> => {
  const files = await collectScannableFiles();
  const violations: Violation[] = [];
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

  for (const filePath of files) {
    const fileContent = await Bun.file(filePath).text();

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      for (const match of fileContent.matchAll(pattern.regex)) {
        if (allowedColorLiteralFiles.has(filePath)) {
          continue;
        }

        violations.push({
          filePath,
          line: getLineFromOffset(fileContent, match.index ?? 0),
          message: pattern.message,
        });
      }
    }
  }

  return violations;
};

const collectContrastViolations = (css: string): string[] => {
  const themes = getThemeColors(css);
  const failures: string[] = [];

  for (const mode of ["light", "dark"] as const) {
    for (const [backgroundToken, contentToken] of contrastPairs) {
      const background = themes[mode].get(backgroundToken);
      const content = themes[mode].get(contentToken);

      if (!background || !content) {
        failures.push(
          `Missing token pair: bao-${mode}-${backgroundToken} / bao-${mode}-${contentToken}`,
        );
        continue;
      }

      const ratio = getContrastRatio(background, content);
      if (ratio < textContrastMinimum) {
        failures.push(
          `Contrast below ${textContrastMinimum.toFixed(1)}: bao-${mode}-${backgroundToken} vs bao-${mode}-${contentToken} = ${ratio.toFixed(2)}`,
        );
      }
    }
  }

  return failures;
};

const main = async (): Promise<void> => {
  const themeCss = await Bun.file(themeFilePath).text();
  const hardcodedColorViolations = await collectHardcodedColorViolations();
  const contrastViolations = collectContrastViolations(themeCss);

  if (hardcodedColorViolations.length === 0 && contrastViolations.length === 0) {
    console.log(
      "UI accessibility validation passed: WCAG contrast and tokenized colors are enforced.",
    );
    return;
  }

  if (hardcodedColorViolations.length > 0) {
    console.error("\nHardcoded color violations:");
    for (const violation of hardcodedColorViolations) {
      console.error(`- ${violation.filePath}:${violation.line} ${violation.message}`);
    }
  }

  if (contrastViolations.length > 0) {
    console.error("\nWCAG contrast violations:");
    for (const violation of contrastViolations) {
      console.error(`- ${violation}`);
    }
  }

  process.exit(1);
};

await main();
