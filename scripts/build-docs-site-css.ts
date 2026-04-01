const ROOT_DIRECTORY = new URL("../", import.meta.url).pathname;
const DOCS_CSS_INPUT_PATH = "docs/assets/docs.css";
const DOCS_CSS_OUTPUT_PATH = "docs/assets/docs.generated.css";

const buildProcess = Bun.spawn(
  [
    process.execPath,
    "x",
    "@tailwindcss/cli",
    "-i",
    DOCS_CSS_INPUT_PATH,
    "-o",
    DOCS_CSS_OUTPUT_PATH,
    "--minify",
  ],
  {
    cwd: ROOT_DIRECTORY,
    stdout: "inherit",
    stderr: "inherit",
  },
);

const exitCode = await buildProcess.exited;

if (exitCode !== 0) {
  process.exit(exitCode);
}
