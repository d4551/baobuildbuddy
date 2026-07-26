import { deflateSync } from "node:zlib";
import { describe, expect, it } from "bun:test";
import {
  extractPdfContentStreams,
  isZlibCompressed,
  pdfRgbFillOperator,
  pdfStreamsContainRgbFill,
} from "./pdf-streams";

const wrapPdfStreams = (bodies: readonly Buffer[]): Uint8Array => {
  const parts = bodies.map(
    (body) => `stream\n${body.toString("latin1")}\nendstream`,
  );
  return Buffer.from(parts.join("\n"), "latin1");
};

describe("pdf-streams", () => {
  it("detects RFC 1950 zlib headers and rejects raw bodies", () => {
    const compressed = deflateSync(Buffer.from("0.2 0.4 0.6 rg", "latin1"));
    expect(isZlibCompressed(compressed)).toBe(true);
    expect(isZlibCompressed(Buffer.from("BT /F1 12 Tf", "latin1"))).toBe(false);
    expect(isZlibCompressed(Buffer.from(""))).toBe(false);
  });

  it("decodes inflated streams and passes raw streams through", () => {
    const compressed = deflateSync(Buffer.from("0.16 0.38 1 rg", "latin1"));
    const raw = Buffer.from("0 0.59 0.53 rg", "latin1");
    const decoded = extractPdfContentStreams(wrapPdfStreams([compressed, raw]));
    expect(decoded).toContain("0.16 0.38 1 rg");
    expect(decoded).toContain("0 0.59 0.53 rg");
  });

  it("matches exact RGB fill operators only", () => {
    const compressed = deflateSync(Buffer.from("0.54 0.17 0.89 rg", "latin1"));
    const pdf = wrapPdfStreams([compressed]);
    expect(pdfRgbFillOperator({ r: 0.54, g: 0.17, b: 0.89 })).toBe("0.54 0.17 0.89 rg");
    expect(pdfStreamsContainRgbFill(pdf, { r: 0.54, g: 0.17, b: 0.89 })).toBe(true);
    expect(pdfStreamsContainRgbFill(pdf, { r: 0.1, g: 0.2, b: 0.3 })).toBe(false);
  });
});
