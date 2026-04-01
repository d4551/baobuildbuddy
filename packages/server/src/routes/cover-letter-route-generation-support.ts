import {
  COVER_LETTER_DEFAULT_CLOSING,
  COVER_LETTER_DEFAULT_OPENING,
} from "@bao/shared/constants/cover-letter";
import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import { safeParseJson } from "@bao/shared/utils/json";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { resumes } from "../db/schema/resumes";
import type { GenerateCoverLetterBody } from "./cover-letter-route-contracts";

export type GeneratedCoverLetterContent = {
  introduction: string;
  body: string;
  conclusion: string;
};

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
const SECTION_LEADING_QUOTE_PATTERN = /^(?:\\?["“”']+)+/u;
const SECTION_TRAILING_QUOTE_PATTERN = /(?:\\?["“”']+)+$/u;
const SECTION_TRAILING_ESCAPE_PATTERN = /\\+$/u;
const SECTION_TRAILING_EDITORIAL_PATTERN =
  /\s+\((?:good|great|strong|clear|works|covers|aligned|solid|meets)[^)]*\)\.?$/iu;
const COMPLETE_SENTENCE_PATTERN = /[.!?]["')\]]?$/u;
const COVER_LETTER_PLANNING_ARTIFACT_PATTERN =
  /(?:~\d+\s+words|total:\s*~?\d+|word limit|under the \d+-word|concise and engaging|draft outline|bullet points?)/iu;
const TRAILING_SENTENCE_PUNCTUATION_PATTERN = /[.!?]+$/u;

const trimTrailingSentencePunctuation = (value: string): string =>
  value.replace(TRAILING_SENTENCE_PUNCTUATION_PATTERN, "");

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

const isJsonRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNonEmptyString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : [];

const parseJsonLikeSegments = (content: string): Record<string, unknown> => {
  const parsedSegments: Record<string, unknown> = {};

  for (const match of content.matchAll(JSON_SEGMENT_PATTERN)) {
    const [, key, rawValue] = match;
    const decodedValue = decodeJsonStringLiteral(rawValue);
    if (decodedValue) {
      parsedSegments[key.toLowerCase()] = decodedValue;
    }
  }

  return parsedSegments;
};

const parseJsonLikeLineSegments = (content: string): Record<string, unknown> => {
  const parsedSegments: Record<string, unknown> = {};

  for (const line of content.split("\n")) {
    const match = line.match(JSON_LINE_SEGMENT_PATTERN);
    const key = match?.groups?.key;
    const rawValue = match?.groups?.value;
    if (!(key && rawValue)) {
      continue;
    }

    const normalizedValue = rawValue
      .trim()
      .replaceAll(/^["“”']+|["“”',}]+$/gu, "")
      .trim();
    if (normalizedValue.length > 0) {
      parsedSegments[key.toLowerCase()] = normalizedValue;
    }
  }

  return parsedSegments;
};

const parseReasoningSegments = (content: string): Record<string, unknown> => {
  const parsedSegments: Record<string, unknown> = {};
  const normalizedContent = content.replaceAll("\r\n", "\n");

  for (const match of normalizedContent.matchAll(REASONING_SECTION_PATTERN)) {
    const sectionName = match[1]?.toLowerCase();
    const sectionValue = match[2]
      ?.trim()
      .replaceAll(/^["“”']+|["“”']+$/gu, "")
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

const parseGeneratedCoverLetterContent = (content: string): Record<string, unknown> => {
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
  return {
    introduction: lines[0] || COVER_LETTER_DEFAULT_OPENING,
    body: lines.slice(1, -1).join("\n\n") || normalizedContent,
    conclusion: lines[lines.length - 1] || COVER_LETTER_DEFAULT_CLOSING,
  };
};

const readCoverLetterSegment = (value: unknown): string => {
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

const readExperienceHighlight = (value: unknown): string => {
  if (!Array.isArray(value)) {
    return "";
  }

  const firstExperience = value.find((entry): entry is Record<string, unknown> =>
    isJsonRecord(entry),
  );
  if (!firstExperience) {
    return "";
  }

  const title = toNonEmptyString(firstExperience.title);
  const company = toNonEmptyString(firstExperience.company);
  const description = toNonEmptyString(firstExperience.description);
  const roleLabel = [title, company].filter((entry) => entry.length > 0).join(" at ");
  return [roleLabel, description].filter((entry) => entry.length > 0).join(", ");
};

const readResumeSkills = (value: unknown): string[] => {
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

const buildFallbackCoverLetterContent = (
  body: GenerateCoverLetterBody,
  resumeContext: ResumePromptContext,
): GeneratedCoverLetterContent => {
  const company = body.company.trim() || DEFAULT_UNSPECIFIED_LABEL;
  const position = body.position.trim() || DEFAULT_UNSPECIFIED_LABEL;
  const skillsLabel = resumeContext.skills.slice(0, 3).join(", ");
  const normalizedExperienceHighlight = trimTrailingSentencePunctuation(
    resumeContext.experienceHighlight,
  );
  const backgroundSentence =
    resumeContext.summary ||
    `I build player-facing gameplay systems and collaborate closely with design and engineering teams.`;
  const experienceSentence =
    normalizedExperienceHighlight.length > 0
      ? `Most recently, I worked as ${normalizedExperienceHighlight}.`
      : "";
  const skillsSentence =
    skillsLabel.length > 0
      ? `I would bring practical experience with ${skillsLabel} to ${company}'s ${position} work.`
      : `I would bring a strong focus on reliable gameplay systems and collaborative iteration to ${company}.`;

  return {
    introduction: `Dear ${company} Team, I am excited to apply for the ${position} role at ${company}.`,
    body: [backgroundSentence, experienceSentence, skillsSentence]
      .filter((entry) => entry.length > 0)
      .join(" "),
    conclusion: `Thank you for your consideration. I would welcome the chance to discuss how my background aligns with the ${position} role at ${company}.`,
  };
};

export const ensureCompleteCoverLetterContent = (
  content: GeneratedCoverLetterContent,
  body: GenerateCoverLetterBody,
  resumeContext: ResumePromptContext,
): GeneratedCoverLetterContent => {
  const fallbackContent = buildFallbackCoverLetterContent(body, resumeContext);
  const introduction = content.introduction.trim();
  const generatedBody = content.body.trim();
  const generatedConclusion = content.conclusion.trim();
  const bodyContent =
    generatedBody.length > 0 &&
    COMPLETE_SENTENCE_PATTERN.test(generatedBody) &&
    !COVER_LETTER_PLANNING_ARTIFACT_PATTERN.test(generatedBody)
      ? generatedBody
      : fallbackContent.body;
  const conclusionContent =
    generatedConclusion.length > 0 &&
    COMPLETE_SENTENCE_PATTERN.test(generatedConclusion) &&
    !COVER_LETTER_PLANNING_ARTIFACT_PATTERN.test(generatedConclusion)
      ? generatedConclusion
      : fallbackContent.conclusion;
  return {
    introduction: introduction || fallbackContent.introduction,
    body: bodyContent,
    conclusion: conclusionContent,
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
