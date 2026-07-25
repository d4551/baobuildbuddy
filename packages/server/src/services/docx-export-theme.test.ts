import { describe, expect, test } from "bun:test";
import {
  resolveCoverLetterDocxTheme,
  resolvePortfolioDocxTheme,
} from "@bao/shared/constants/export-document-theme";
import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import { inflateRawSync } from "node:zlib";
import { exportCoverLetterDocxDocument } from "./docx-export-cover-letter";
import { exportPortfolioDocxDocument } from "./docx-export-portfolio";

const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_COMPRESSION_STORED = 0;
const ZIP_COMPRESSION_DEFLATE = 8;

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }
  throw new Error("Generated DOCX is missing ZIP central directory");
}

function extractZipEntry(bytes: Uint8Array, entryName: string): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const endOfCentralDirectoryOffset = findEndOfCentralDirectory(bytes);
  const centralDirectoryOffset = view.getUint32(endOfCentralDirectoryOffset + 16, true);
  let offset = centralDirectoryOffset;

  while (view.getUint32(offset, true) === ZIP_CENTRAL_DIRECTORY_FILE_HEADER_SIGNATURE) {
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const fileCommentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileNameStart = offset + 46;
    const fileName = decoder.decode(bytes.subarray(fileNameStart, fileNameStart + fileNameLength));

    if (fileName === entryName) {
      if (view.getUint32(localHeaderOffset, true) !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
        throw new Error(`Generated DOCX has an invalid ZIP local header for ${entryName}`);
      }
      const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraFieldLength = view.getUint16(localHeaderOffset + 28, true);
      const compressedDataStart =
        localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
      const compressedData = bytes.subarray(
        compressedDataStart,
        compressedDataStart + compressedSize,
      );

      if (compressionMethod === ZIP_COMPRESSION_STORED) {
        return compressedData;
      }
      if (compressionMethod === ZIP_COMPRESSION_DEFLATE) {
        return inflateRawSync(compressedData);
      }
      throw new Error(`Generated DOCX uses unsupported ZIP compression ${compressionMethod}`);
    }

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  throw new Error(`Generated DOCX is missing ${entryName}`);
}

async function readDocumentXml(docxBytes: Uint8Array): Promise<string> {
  const documentXml = extractZipEntry(docxBytes, "word/document.xml");
  return new TextDecoder().decode(documentXml);
}

describe("DOCX export themes", () => {
  test("cover-letter DOCX exports include template-specific primary colors", async () => {
    const creativeTheme = resolveCoverLetterDocxTheme("creative");
    const technicalTheme = resolveCoverLetterDocxTheme("technical");
    expect(creativeTheme.primaryColorHex).not.toBe(technicalTheme.primaryColorHex);

    const baseCoverLetter = {
      company: "Studio Example",
      position: "Gameplay Engineer",
      content: "I build readable combat systems for game teams.",
    };
    const userProfile = {
      name: "Alex Example",
      email: "alex@example.com",
    };

    const creativeXml = await readDocumentXml(
      await exportCoverLetterDocxDocument(
        { ...baseCoverLetter, template: "creative" },
        userProfile,
      ),
    );
    const technicalXml = await readDocumentXml(
      await exportCoverLetterDocxDocument(
        { ...baseCoverLetter, template: "technical" },
        userProfile,
      ),
    );

    expect(creativeXml).toContain(creativeTheme.primaryColorHex);
    expect(technicalXml).toContain(technicalTheme.primaryColorHex);
  });

  test("portfolio DOCX exports include template-specific primary colors", async () => {
    const modernTheme = resolvePortfolioDocxTheme("modern");
    const showcaseTheme = resolvePortfolioDocxTheme("showcase");
    expect(modernTheme.primaryColorHex).not.toBe(showcaseTheme.primaryColorHex);

    const metadata: PortfolioMetadata = {
      title: "Gameplay Portfolio",
      author: "Alex Example",
      bio: "Systems designer and gameplay engineer.",
      email: "alex@example.com",
    };
    const projects: PortfolioProject[] = [
      {
        title: "Arena Prototype",
        description: "A tactical arena prototype with readable encounters.",
        technologies: ["Unreal Engine", "C++"],
        tags: ["combat"],
        featured: true,
      },
    ];

    const modernXml = await readDocumentXml(
      await exportPortfolioDocxDocument(metadata, projects, "modern"),
    );
    const showcaseXml = await readDocumentXml(
      await exportPortfolioDocxDocument(metadata, projects, "showcase"),
    );

    expect(modernXml).toContain(modernTheme.primaryColorHex);
    expect(showcaseXml).toContain(showcaseTheme.primaryColorHex);
  });
});
