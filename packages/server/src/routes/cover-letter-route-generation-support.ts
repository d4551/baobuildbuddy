import { API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT } from "@bao/shared/constants/api-errors";
import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import { type JsonObject, safeParseJson } from "@bao/shared/utils/json";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { resumes } from "../db/schema/resumes";

export type GeneratedCoverLetterContent = {
  introduction: string;
  body: string;
  conclusion: string;
};

export type CoverLetterSectionName = keyof GeneratedCoverLetterContent;

export type CoverLetterContentError = {
  code: "COVER_LETTER_INCOMPLETE_CONTENT";
  message: typeof API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT;
  missingSections: CoverLetterSectionName[];
  reasons: string[];
};

export type CoverLetterContentResult =
  | { success: true; data: GeneratedCoverLetterContent }
  | { success: false; error: CoverLetterContentError };

export type ResumePromptContext = {
  promptContext: string;
  summary: string;
  experienceHighlight: string;
  skills: string[];
};

const LEADING_MARKDOWN_CODE_FENCE_PATTERN = /^```[a-zA-Z0-9_-]*\n?/u;
const TRAILING_MARKDOWN_CODE_FENCE_PATTERN = /\n```$/u;
const JSON_OBJECT_BLOCK_PATTERN = /\{[\s\S]*\}/u;
const JSON_SEGMENT_PATTERN =
  /"(introduction|intro|body|main|conclusion|closing)"\s*:\s*"((?:\\.|[^"\\])*)"/giu;
const JSON_LINE_SEGMENT_PATTERN =
  /^\s*"(?<key>introduction|intro|body|main|conclusion|closing)"\s*:\s*"?(?<value>.+)$/iu;
const REASONING_SECTION_PATTERN =
  /(?:^|\n)\s*(?:[*-]\s*)?[*]?(introduction|body|conclusion)[*]?\s*:\s*([\s\S]*?)(?=\n\s*(?:[*-]\s*)?[*]?(?:introduction|body|conclusion)[*]?\s*:|$)/giu;
const SECTION_REASONING_TAIL_PATTERN = /\n{2,}\d+\.\s[\s\S]*$/u;
const SECTION_LEADING_BULLET_PATTERN = /^\*\s+/u;
const SECTION_LEADING_QUOTE_PATTERN = /^(?:\\?[""']+)+/u;
const SECTION_TRAILING_QUOTE_PATTERN = /(?:\\?[""']+)+$/u;
const SECTION_TRAILING_ESCAPE_PATTERN = /\\+$/u;
const SECTION_TRAILING_EDITORIAL_PATTERN =
  /\s+\((?:good|great|strong|clear|works|covers|aligned|solid|meets)[^)]*\)\.?$/iu;
const COMPLETE_SENTENCE_PATTERN = /[.!?]["')\]]?$/u;
const COVER_LETTER_PLANNING_ARTIFACT_PATTERN =
  /(?:~\d+\s+words|total:\s*~?\d+|word limit|under the \d+-word|concise and engaging|draft outline|bullet points?)/iu;

const stripMarkdownCodeFence = (content: string): string => {
  const trimmed = content.trim();
  return trimmed
    .replace(LEADING_MARKDOWN_CODE_FENCE_PATTERN, "")
    .replace(TRAILING_MARKDOWN_CODE_FENCE_PATTERN, "")
    .trim();
};

const extractJsonObjectBlock = (content: string): string | null => {
  const match = content.match(JSON_OBJECT_BLOCK_PATTERN);
  return match?.[0] ?? null;
};

const decodeJsonStringLiteral = (value: string): string | null => {
  const decoded = safeParseJson(`"${value}"`);
  return typeof decoded === "string" ? decoded : null;
};

const isJsonRecord = <T>(value: T): value is T & JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNonEmptyString = <T>(value: T): string => (typeof value === "string" ? value.trim() : "");

const toStringArray = <T>(value: T): string[] =>
  Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];

const parseJsonLikeSegments = (content: string): JsonObject => {
  const parsedSegments: JsonObject = {};

  for (const match of content.matchAll(JSON_SEGMENT_PATTERN)) {
    const [, key, rawValue] = match;
    const decodedValue = decodeJsonStringLiteral(rawValue);
    if (decodedValue) {
      parsedSegments[key.toLowerCase()] = decodedValue;
    }
  }

  return parsedSegments;
};

const parseJsonLikeLineSegments = (content: string): JsonObject => {
  const parsedSegments: JsonObject = {};

  for (const line of content.split("\n")) {
    const match = line.match(JSON_LINE_SEGMENT_PATTERN);
    const key = match?.groups?.key;
    const rawValue = match?.groups?.value;
    if (!(key && rawValue)) {
      continue;
    }

    const normalizedValue = rawValue
      .trim()
      .replaceAll(/^[""']+|[""',}]+$/gu, "")
      .trim();
    if (normalizedValue.length > 0) {
      parsedSegments[key.toLowerCase()] = normalizedValue;
    }
  }

  return parsedSegments;
};

const parseReasoningSegments = (content: string): JsonObject => {
  const parsedSegments: JsonObject = {};
  const normalizedContent = content.replaceAll("\r\n", "\n");

  for (const match of normalizedContent.matchAll(REASONING_SECTION_PATTERN)) {
    const sectionName = match[1]?.toLowerCase();
    const sectionValue = match[2]
      ?.trim()
      .replaceAll(/^[""']+|[""']+$/gu, "")
      .trim();
    if (sectionName && sectionValue) {
      parsedSegments[sectionName] = sectionValue;
    }
  }

  return parsedSegments;
};

const cleanGeneratedCoverLetterSegment = (value: string): string =>
  value
    .trim()
    .replace(SECTION_LEADING_BULLET_PATTERN, "")
    .replace(SECTION_LEADING_QUOTE_PATTERN, "")
    .replace(SECTION_REASONING_TAIL_PATTERN, "")
    .replace(SECTION_TRAILING_EDITORIAL_PATTERN, "")
    .replace(SECTION_TRAILING_QUOTE_PATTERN, "")
    .replace(SECTION_TRAILING_ESCAPE_PATTERN, "")
    .trim();

const parseGeneratedCoverLetterContent = (content: string): JsonObject => {
  const normalizedContent = stripMarkdownCodeFence(content);
  const parsed = safeParseJson(normalizedContent);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }

  const parsedReasoningSegments = parseReasoningSegments(normalizedContent);
  if (Object.keys(parsedReasoningSegments).length > 0) {
    return parsedReasoningSegments;
  }

  const parsedJsonLineSegments = parseJsonLikeLineSegments(normalizedContent);
  if (Object.keys(parsedJsonLineSegments).length > 0) {
    return parsedJsonLineSegments;
  }

  const embeddedJson = extractJsonObjectBlock(normalizedContent);
  if (embeddedJson) {
    const parsedEmbeddedJson = safeParseJson(embeddedJson);
    if (
      parsedEmbeddedJson &&
      typeof parsedEmbeddedJson === "object" &&
      !Array.isArray(parsedEmbeddedJson)
    ) {
      return parsedEmbeddedJson;
    }

    const parsedJsonLikeSegments = parseJsonLikeSegments(embeddedJson);
    if (Object.keys(parsedJsonLikeSegments).length > 0) {
      return parsedJsonLikeSegments;
    }
  }

  const lines = normalizedContent.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return {
      introduction: "",
      body: "",
      conclusion: "",
    };
  }

  if (lines.length === 1) {
    return {
      introduction: "",
      body: lines[0],
      conclusion: "",
    };
  }

  return {
    introduction: lines[0],
    body: lines.slice(1, -1).join("\n\n"),
    conclusion: lines[lines.length - 1],
  };
};

const readCoverLetterSegment = <T>(value: T): string => {
  if (typeof value === "string") {
    return cleanGeneratedCoverLetterSegment(value);
  }
  if (Array.isArray(value)) {
    return cleanGeneratedCoverLetterSegment(
      value.filter((entry): entry is string => typeof entry === "string").join("\n\n"),
    );
  }
  return "";
};

const readExperienceHighlight = <T>(value: T): string => {
  if (!Array.isArray(value)) {
    return "";
  }

  const firstExperience = value.find((entry): entry is JsonObject => isJsonRecord(entry));
  if (!firstExperience) {
    return "";
  }

  const title = toNonEmptyString(firstExperience.title);
  const company = toNonEmptyString(firstExperience.company);
  const description = toNonEmptyString(firstExperience.description);
  const roleLabel = [title, company].filter((entry) => entry.length > 0).join(" at ");
  return [roleLabel, description].filter((entry) => entry.length > 0).join(", ");
};

const readResumeSkills = <T>(value: T): string[] => {
  if (Array.isArray(value)) {
    return toStringArray(value);
  }

  if (!isJsonRecord(value)) {
    return [];
  }

  return Object.values(value).flatMap((entry) => toStringArray(entry));
};

export const resolveResumeContext = async (resumeId?: string): Promise<ResumePromptContext> => {
  if (!resumeId) {
    return {
      promptContext: "",
      summary: "",
      experienceHighlight: "",
      skills: [],
    };
  }
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  if (resumeRows.length === 0) {
    return {
      promptContext: "",
      summary: "",
      experienceHighlight: "",
      skills: [],
    };
  }

  const resume = resumeRows[0];
  const personalInfo = resume.personalInfo || {};
  const resumeName =
    typeof personalInfo.name === "string" && personalInfo.name.trim()
      ? personalInfo.name
      : DEFAULT_UNSPECIFIED_LABEL;
  const summary = toNonEmptyString(resume.summary);
  const experienceHighlight = readExperienceHighlight(resume.experience);
  const skills = readResumeSkills(resume.skills);

  return {
    promptContext: `
Resume Context:
Name: ${resumeName}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Skills: ${JSON.stringify(resume.skills, null, 2)}
  `.trim(),
    summary,
    experienceHighlight,
    skills,
  };
};

const describeUnusableSection = (section: CoverLetterSectionName, value: string): string | null => {
  if (value.length === 0) {
    return `${section} is empty`;
  }
  if (!COMPLETE_SENTENCE_PATTERN.test(value)) {
    return `${section} is not a complete sentence`;
  }
  if (COVER_LETTER_PLANNING_ARTIFACT_PATTERN.test(value)) {
    return `${section} contains planning artifacts instead of letter copy`;
  }
  return null;
};

export const validateGeneratedCoverLetterContent = (
  content: GeneratedCoverLetterContent,
): CoverLetterContentResult => {
  const introduction = content.introduction.trim();
  const body = content.body.trim();
  const conclusion = content.conclusion.trim();
  const missingSections: CoverLetterSectionName[] = [];
  const reasons: string[] = [];

  for (const [section, value] of [
    ["introduction", introduction],
    ["body", body],
    ["conclusion", conclusion],
  ] as const) {
    const reason = describeUnusableSection(section, value);
    if (reason) {
      missingSections.push(section);
      reasons.push(reason);
    }
  }

  if (missingSections.length > 0) {
    return {
      success: false,
      error: {
        code: "COVER_LETTER_INCOMPLETE_CONTENT",
        message: API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT,
        missingSections,
        reasons,
      },
    };
  }

  return {
    success: true,
    data: {
      introduction,
      body,
      conclusion,
    },
  };
};

export const toGeneratedCoverLetterContent = (content: string): GeneratedCoverLetterContent => {
  const generatedContent = parseGeneratedCoverLetterContent(content);
  return {
    introduction:
      readCoverLetterSegment(generatedContent.introduction) ||
      readCoverLetterSegment(generatedContent.intro),
    body:
      readCoverLetterSegment(generatedContent.body) ||
      readCoverLetterSegment(generatedContent.main),
    conclusion:
      readCoverLetterSegment(generatedContent.conclusion) ||
      readCoverLetterSegment(generatedContent.closing),
  };
};
