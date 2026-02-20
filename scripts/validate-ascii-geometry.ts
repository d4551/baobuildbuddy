import path from "node:path";

const filePath = process.argv[2] ?? "README.md";
const filePathName = path.resolve(process.cwd(), filePath);

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

const fileText = await Bun.file(filePathName).text();
const lines = fileText.split("\n");

const GRAPH_CHARS = new Set(["+", "-", "|"]);
const HORIZONTAL_ENDPOINTS = new Set(["+", "|"]);
const VERTICAL_ENDPOINTS = new Set(["+"]);
const DIRECTIONS = [
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: -1, col: 0 },
  { row: 1, col: 0 },
];

const isGraphChar = (ch: string) => GRAPH_CHARS.has(ch);

const hasConnection = (from: string, to: string, dr: number, dc: number): boolean => {
  if (!isGraphChar(to) || (dr !== 0 && dc !== 0)) return false;

  if (dr !== 0) {
    if (from === "|") return to === "|" || to === "+";
    if (from === "+") return to === "|" || to === "+" || to === "-";
    return false;
  }

  if (dc !== 0) {
    if (from === "-") return to === "-" || to === "+";
    if (from === "+") return to === "-" || to === "+" || to === "|";
    return false;
  }

  return false;
};

const canConnect = (
  grid: string[],
  row: number,
  col: number,
  otherRow: number,
  otherCol: number,
): boolean => {
  if (
    otherRow < 0 ||
    otherCol < 0 ||
    otherRow >= grid.length ||
    otherCol >= grid[otherRow].length
  ) {
    return false;
  }

  const source = grid[row][col];
  const target = grid[otherRow][otherCol];
  const dr = otherRow - row;
  const dc = otherCol - col;

  return hasConnection(source, target, dr, dc) && hasConnection(target, source, -dr, -dc);
};

const buildComponents = (
  grid: string[],
  width: number,
): { componentIds: number[][]; components: Component[] } => {
  const height = grid.length;
  const componentIds = Array.from({ length: height }, () => Array(width).fill(-1));
  const components: Component[] = [];

  let nextId = 0;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (!isGraphChar(grid[row][col]) || componentIds[row][col] !== -1) {
        continue;
      }

      const cells: Coord[] = [];
      let hasPlus = false;
      const stack: Coord[] = [{ row, col }];
      componentIds[row][col] = nextId;

      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;
        const cell = grid[current.row][current.col];

        cells.push(current);
        if (cell === "+") {
          hasPlus = true;
        }

        for (const direction of DIRECTIONS) {
          const nextRow = current.row + direction.row;
          const nextCol = current.col + direction.col;

          if (nextRow < 0 || nextCol < 0 || nextRow >= height || nextCol >= width) {
            continue;
          }
          if (!isGraphChar(grid[nextRow][nextCol]) || componentIds[nextRow][nextCol] !== -1) {
            continue;
          }

          componentIds[nextRow][nextCol] = nextId;
          stack.push({ row: nextRow, col: nextCol });
        }
      }

      components.push({
        hasPlus,
        cells,
      });
      nextId += 1;
    }
  }

  return { componentIds, components };
};

const analyzeBlock = (
  blockLines: string[],
  blockIndex: number,
  blockStartLine: number,
): Failure[] => {
  const failures: Failure[] = [];
  const maxWidth = Math.max(0, ...blockLines.map((line) => line.length));
  const grid = blockLines.map((line) => line.padEnd(maxWidth, " "));
  const height = grid.length;
  const width = maxWidth;
  const { componentIds, components } = buildComponents(grid, width);

  const lineInBlock = (lineOffset: number, ch: string, reason: string, colOffset: number) => {
    failures.push({
      blockIndex,
      lineNumber: blockStartLine + lineOffset + 1,
      columnNumber: colOffset + 1,
      ch,
      reason,
    });
  };

  const countConnectedNeighbors = (row: number, col: number): number => {
    let connected = 0;

    for (const direction of DIRECTIONS) {
      if (canConnect(grid, row, col, row + direction.row, col + direction.col)) {
        connected += 1;
      }
    }

    return connected;
  };

  const validateDegree = (row: number, col: number, current: string): void => {
    const connected = countConnectedNeighbors(row, col);

    if (current === "-") {
      if (connected !== 2) {
        lineInBlock(row, current, `horizontal segment has degree ${connected}, expected 2`, col);
      }
      return;
    }

    if (current === "|") {
      if (connected !== 2) {
        lineInBlock(row, current, `vertical segment has degree ${connected}, expected 2`, col);
      }
      return;
    }

    if (current === "+") {
      if (connected < 2) {
        lineInBlock(row, current, `junction has degree ${connected}, expected >= 2`, col);
      }
    }
  };

  for (const component of components) {
    if (!component.hasPlus) {
      continue;
    }

    for (const cell of component.cells) {
      const current = grid[cell.row][cell.col];
      validateDegree(cell.row, cell.col, current);
    }
  }

  for (let row = 0; row < height; row += 1) {
    let col = 0;
    while (col < width) {
      if (grid[row][col] !== "-") {
        col += 1;
        continue;
      }

      const runStart = col;
      while (col + 1 < width && grid[row][col + 1] === "-") {
        col += 1;
      }
      const runEnd = col;
      const runLength = runEnd - runStart + 1;
      const componentId = componentIds[row][runStart];

      if (runLength >= 2 && componentId >= 0 && components[componentId]?.hasPlus) {
        const left = runStart > 0 ? grid[row][runStart - 1] : " ";
        const right = runEnd + 1 < width ? grid[row][runEnd + 1] : " ";

        if (!HORIZONTAL_ENDPOINTS.has(left)) {
          lineInBlock(
            row,
            "-",
            "horizontal run start must connect to a box corner or side",
            runStart,
          );
        }
        if (!HORIZONTAL_ENDPOINTS.has(right)) {
          lineInBlock(row, "-", "horizontal run end must connect to a box corner or side", runEnd);
        }
      }

      col = runEnd + 1;
    }
  }

  for (let col = 0; col < width; col += 1) {
    let row = 0;
    while (row < height) {
      if (grid[row][col] !== "|") {
        row += 1;
        continue;
      }

      const runStart = row;
      while (row + 1 < height && grid[row + 1][col] === "|") {
        row += 1;
      }
      const runEnd = row;
      const runLength = runEnd - runStart + 1;
      const componentId = componentIds[runStart][col];

      if (runLength >= 2 && componentId >= 0 && components[componentId]?.hasPlus) {
        const top = runStart > 0 ? grid[runStart - 1][col] : " ";
        const bottom = runEnd + 1 < height ? grid[runEnd + 1][col] : " ";

        if (!VERTICAL_ENDPOINTS.has(top)) {
          lineInBlock(runStart, "|", "vertical run start must connect at the top", runStart);
        }
        if (!VERTICAL_ENDPOINTS.has(bottom)) {
          lineInBlock(runEnd, "|", "vertical run end must connect at the bottom", col);
        }
      }

      row = runEnd + 1;
    }
  }

  return failures;
};

const collectDiagnostics = (linesToAnalyze: string[]): Failure[] => {
  const diagnostics: Failure[] = [];
  let inBlock = false;
  let currentBlock = 0;
  let blockStartLine = 0;
  let blockLines: string[] = [];

  for (const [index, line] of linesToAnalyze.entries()) {
    if (line === "```text") {
      if (!inBlock) {
        inBlock = true;
        currentBlock += 1;
        blockStartLine = index;
        blockLines = [];
      }
      continue;
    }

    if (line === "```" && inBlock) {
      diagnostics.push(...analyzeBlock(blockLines, currentBlock, blockStartLine));
      inBlock = false;
      blockLines = [];
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

const diagnostics = collectDiagnostics(lines);

if (diagnostics.length === 0) {
  console.log(`✅ geometry pass for README art blocks in ${filePath}`);
  process.exit(0);
}

console.log(`❌ geometry issues found: ${diagnostics.length}`);
for (const d of diagnostics) {
  console.log(
    `block #${d.blockIndex} line ${d.lineNumber} col ${d.columnNumber} char ${JSON.stringify(d.ch)} :: ${d.reason}`,
  );
}
process.exit(1);
