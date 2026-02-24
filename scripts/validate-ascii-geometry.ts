import { writeOutput } from "./utils/cli-output";

const args = process.argv.slice(2);
const validateAllTextBlocks = args.includes("--all");
const filePaths = args.filter((arg) => arg !== "--all");
const filesToValidate = filePaths.length > 0 ? filePaths : ["README.md"];

type Failure = {
  blockIndex: number;
  lineNumber: number;
  columnNumber: number;
  ch: string;
  reason: string;
};

type Coord = {
  row: number;
  col: number;
};

type Component = {
  hasPlus: boolean;
  cells: Coord[];
};

type ConnectionProbe = {
  source: Coord;
  target: Coord;
};

const GRAPH_CHARS = new Set(["+", "-", "|"]);
const HORIZONTAL_ENDPOINTS = new Set(["+", "|"]);
const VERTICAL_ENDPOINTS = new Set(["+"]);
const DIRECTIONS = [
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: -1, col: 0 },
  { row: 1, col: 0 },
];

const ASCII_BOX_BLOCK_START_MARKERS = new Set([
  "```ascii-box",
  "```text ascii-box",
  "```txt ascii-box",
]);
const HORIZONTAL_CONNECTIONS = new Map<string, Set<string>>([
  ["-", new Set(["-", "+"])],
  ["|", new Set<string>()],
  ["+", new Set(["-", "+", "|"])],
]);
const VERTICAL_CONNECTIONS = new Map<string, Set<string>>([
  ["-", new Set<string>()],
  ["|", new Set(["|", "+"])],
  ["+", new Set(["-", "+", "|"])],
]);

const isGraphChar = (ch: string): boolean => GRAPH_CHARS.has(ch);

const isWithinBounds = (row: number, col: number, height: number, width: number): boolean =>
  row >= 0 && col >= 0 && row < height && col < width;

const isOrthogonalDirection = (dr: number, dc: number): boolean =>
  (dr === 0 && dc !== 0) || (dr !== 0 && dc === 0);

const hasConnection = (from: string, to: string, dr: number, dc: number): boolean => {
  if (!(isGraphChar(to) && isOrthogonalDirection(dr, dc))) {
    return false;
  }

  const allowedTargets = dr !== 0 ? VERTICAL_CONNECTIONS.get(from) : HORIZONTAL_CONNECTIONS.get(from);
  return allowedTargets ? allowedTargets.has(to) : false;
};

const canConnect = (grid: string[], { source, target: targetCoord }: ConnectionProbe): boolean => {
  const otherRow = targetCoord.row;
  const otherCol = targetCoord.col;
  if (!isWithinBounds(otherRow, otherCol, grid.length, grid[otherRow]?.length ?? 0)) {
    return false;
  }

  const sourceChar = grid[source.row][source.col];
  const targetChar = grid[otherRow][otherCol];
  const dr = otherRow - source.row;
  const dc = otherCol - source.col;

  return (
    hasConnection(sourceChar, targetChar, dr, dc) &&
    hasConnection(targetChar, sourceChar, -dr, -dc)
  );
};

interface ExploreComponentOptions {
  grid: string[];
  width: number;
  componentIds: number[][];
  start: Coord;
  componentId: number;
}

const tryQueueNeighbor = (
  options: ExploreComponentOptions,
  stack: Coord[],
  current: Coord,
  direction: { row: number; col: number },
): void => {
  const height = options.grid.length;
  const nextRow = current.row + direction.row;
  const nextCol = current.col + direction.col;
  if (!isWithinBounds(nextRow, nextCol, height, options.width)) {
    return;
  }
  if (!isGraphChar(options.grid[nextRow][nextCol])) {
    return;
  }
  if (options.componentIds[nextRow][nextCol] !== -1) {
    return;
  }

  options.componentIds[nextRow][nextCol] = options.componentId;
  stack.push({ row: nextRow, col: nextCol });
};

const exploreComponent = (options: ExploreComponentOptions): Component => {
  const cells: Coord[] = [];
  const stack: Coord[] = [options.start];
  let hasPlus = false;
  options.componentIds[options.start.row][options.start.col] = options.componentId;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const currentChar = options.grid[current.row][current.col];
    cells.push(current);
    if (currentChar === "+") {
      hasPlus = true;
    }

    for (const direction of DIRECTIONS) {
      tryQueueNeighbor(options, stack, current, direction);
    }
  }

  return { hasPlus, cells };
};

const buildComponents = (
  grid: string[],
  width: number,
): { componentIds: number[][]; components: Component[] } => {
  const height = grid.length;
  const componentIds = Array.from({ length: height }, () => Array<number>(width).fill(-1));
  const components: Component[] = [];
  let nextId = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (!isGraphChar(grid[row][col]) || componentIds[row][col] !== -1) {
        continue;
      }

      const component = exploreComponent({ grid, width, componentIds, start: { row, col }, componentId: nextId });
      components.push(component);
      nextId += 1;
    }
  }

  return { componentIds, components };
};

type FailureReporter = (
  lineOffset: number,
  ch: string,
  reason: string,
  colOffset: number,
) => void;

const createFailureReporter = (
  failures: Failure[],
  blockIndex: number,
  blockStartLine: number,
): FailureReporter => {
  return (lineOffset, ch, reason, colOffset) => {
    failures.push({
      blockIndex,
      lineNumber: blockStartLine + lineOffset + 1,
      columnNumber: colOffset + 1,
      ch,
      reason,
    });
  };
};

const countConnectedNeighbors = (grid: string[], row: number, col: number): number => {
  let connected = 0;

  for (const direction of DIRECTIONS) {
    const probe = {
      source: { row, col },
      target: { row: row + direction.row, col: col + direction.col },
    };
    if (canConnect(grid, probe)) {
      connected += 1;
    }
  }

  return connected;
};

interface DegreeValidationInput {
  grid: string[];
  row: number;
  col: number;
  current: string;
  reportFailure: FailureReporter;
}

const validateDegree = ({
  grid,
  row,
  col,
  current,
  reportFailure,
}: DegreeValidationInput): void => {
  const connected = countConnectedNeighbors(grid, row, col);

  if (current === "-") {
    if (connected !== 2) {
      reportFailure(row, current, `horizontal segment has degree ${connected}, expected 2`, col);
    }
    return;
  }

  if (current === "|") {
    if (connected !== 2) {
      reportFailure(row, current, `vertical segment has degree ${connected}, expected 2`, col);
    }
    return;
  }

  if (current === "+" && connected < 2) {
    reportFailure(row, current, `junction has degree ${connected}, expected >= 2`, col);
  }
};

const validateComponentDegrees = (
  grid: string[],
  components: Component[],
  reportFailure: FailureReporter,
): void => {
  for (const component of components) {
    if (!component.hasPlus) {
      continue;
    }

    for (const cell of component.cells) {
      const current = grid[cell.row][cell.col];
      validateDegree({
        grid,
        row: cell.row,
        col: cell.col,
        current,
        reportFailure,
      });
    }
  }
};

const isBoxComponent = (components: Component[], componentId: number): boolean =>
  componentId >= 0 && Boolean(components[componentId]?.hasPlus);

interface RunValidationContext {
  grid: string[];
  width: number;
  height: number;
  componentIds: number[][];
  components: Component[];
  reportFailure: FailureReporter;
}

const validateHorizontalRun = (
  context: RunValidationContext,
  row: number,
  runStart: number,
  runEnd: number,
): void => {
  const runLength = runEnd - runStart + 1;
  const componentId = context.componentIds[row][runStart];
  if (runLength < 2 || !isBoxComponent(context.components, componentId)) {
    return;
  }

  const left = runStart > 0 ? context.grid[row][runStart - 1] : " ";
  const right = runEnd + 1 < context.width ? context.grid[row][runEnd + 1] : " ";
  if (!HORIZONTAL_ENDPOINTS.has(left)) {
    context.reportFailure(
      row,
      "-",
      "horizontal run start must connect to a box corner or side",
      runStart,
    );
  }
  if (!HORIZONTAL_ENDPOINTS.has(right)) {
    context.reportFailure(row, "-", "horizontal run end must connect to a box corner or side", runEnd);
  }
};

const validateHorizontalRuns = (context: RunValidationContext): void => {
  for (let row = 0; row < context.grid.length; row += 1) {
    let col = 0;
    while (col < context.width) {
      if (context.grid[row][col] !== "-") {
        col += 1;
        continue;
      }

      const runStart = col;
      while (col + 1 < context.width && context.grid[row][col + 1] === "-") {
        col += 1;
      }
      const runEnd = col;
      validateHorizontalRun(context, row, runStart, runEnd);
      col = runEnd + 1;
    }
  }
};

const validateVerticalRun = (
  context: RunValidationContext,
  col: number,
  runStart: number,
  runEnd: number,
): void => {
  const runLength = runEnd - runStart + 1;
  const componentId = context.componentIds[runStart][col];
  if (runLength < 2 || !isBoxComponent(context.components, componentId)) {
    return;
  }

  const top = runStart > 0 ? context.grid[runStart - 1][col] : " ";
  const bottom = runEnd + 1 < context.height ? context.grid[runEnd + 1][col] : " ";
  if (!VERTICAL_ENDPOINTS.has(top)) {
    context.reportFailure(runStart, "|", "vertical run start must connect at the top", col);
  }
  if (!VERTICAL_ENDPOINTS.has(bottom)) {
    context.reportFailure(runEnd, "|", "vertical run end must connect at the bottom", col);
  }
};

const validateVerticalRuns = (context: RunValidationContext): void => {
  for (let col = 0; col < context.width; col += 1) {
    let row = 0;
    while (row < context.height) {
      if (context.grid[row][col] !== "|") {
        row += 1;
        continue;
      }

      const runStart = row;
      while (row + 1 < context.height && context.grid[row + 1][col] === "|") {
        row += 1;
      }
      const runEnd = row;
      validateVerticalRun(context, col, runStart, runEnd);
      row = runEnd + 1;
    }
  }
};

const getPaddedGrid = (blockLines: string[]): { grid: string[]; width: number; height: number } => {
  const width = Math.max(0, ...blockLines.map((line) => line.length));
  const grid = blockLines.map((line) => line.padEnd(width, " "));
  return { grid, width, height: grid.length };
};

const analyzeBlock = (
  blockLines: string[],
  blockIndex: number,
  blockStartLine: number,
): Failure[] => {
  const failures: Failure[] = [];
  const { grid, width, height } = getPaddedGrid(blockLines);
  const { componentIds, components } = buildComponents(grid, width);
  const reportFailure = createFailureReporter(failures, blockIndex, blockStartLine);
  const context: RunValidationContext = {
    grid,
    width,
    height,
    componentIds,
    components,
    reportFailure,
  };

  validateComponentDegrees(grid, components, reportFailure);
  validateHorizontalRuns(context);
  validateVerticalRuns(context);

  return failures;
};

const shouldStartValidationBlock = (trimmedLine: string): boolean => {
  if (ASCII_BOX_BLOCK_START_MARKERS.has(trimmedLine)) {
    return true;
  }
  return validateAllTextBlocks && trimmedLine === "```text";
};

const collectDiagnostics = (linesToAnalyze: string[]): Failure[] => {
  const diagnostics: Failure[] = [];
  let inBlock = false;
  let currentBlock = 0;
  let blockStartLine = 0;
  let blockLines: string[] = [];

  for (const [index, line] of linesToAnalyze.entries()) {
    const trimmedLine = line.trim();
    if (shouldStartValidationBlock(trimmedLine)) {
      if (!inBlock) {
        inBlock = true;
        currentBlock += 1;
        blockStartLine = index;
        blockLines = [];
      }
      continue;
    }

    if (trimmedLine === "```") {
      if (inBlock) {
        diagnostics.push(...analyzeBlock(blockLines, currentBlock, blockStartLine));
        inBlock = false;
        blockLines = [];
      }
      continue;
    }

    if (inBlock) {
      blockLines.push(line);
    }
  }

  if (inBlock && blockLines.length > 0) {
    diagnostics.push(...analyzeBlock(blockLines, currentBlock, blockStartLine));
  }

  return diagnostics;
};

const diagnosticsByFile = await Promise.all(
  filesToValidate.map(async (filePath) => {
    const fileText = await Bun.file(filePath).text();
    const lines = fileText.split("\n");
    return {
      filePath,
      diagnostics: collectDiagnostics(lines),
    };
  }),
);

const outputLines = diagnosticsByFile.flatMap(({ filePath, diagnostics }) => {
  if (diagnostics.length === 0) {
    return [`✅ geometry pass in ${filePath}`];
  }

  return [
    `❌ geometry issues found in ${filePath}: ${diagnostics.length}`,
    ...diagnostics.map(
      (diagnostic) =>
        `block #${diagnostic.blockIndex} line ${diagnostic.lineNumber} col ${diagnostic.columnNumber} char ${JSON.stringify(diagnostic.ch)} :: ${diagnostic.reason}`,
    ),
  ];
});

await writeOutput(outputLines.join("\n"));

const failedFileCount = diagnosticsByFile.filter(
  ({ diagnostics }) => diagnostics.length > 0,
).length;
if (failedFileCount > 0) {
  process.exit(1);
}
