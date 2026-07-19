import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * AI annotation provenance gate (AGENTS.md AI integration best practices).
 *
 * Every surface that renders AI-generated content (chat replies, resume
 * analysis, cover-letter sections, job-match results, interview scoring)
 * must display provenance: which provider made the assessment, which model,
 * and a confidence signal where the route contract exposes one.
 *
 * Server contracts (packages/server/src/routes/ai-route-contracts.ts):
 *   - chatRouteResponseSchema: { content, provider, model }
 *   - analyzeResumeResponseSchema: { analysis, provider, model }
 *   - generateCoverLetterResponseSchema: { content, provider, model }
 *   - matchJobsResponseSchema: { matches[] }
 *   - interview confidence: t.Number()
 *   - skill-mapping confidence: t.Number({ minimum: 0, maximum: 100 })
 *
 * This gate catches pages/composables that consume AI responses but do not
 * surface provider/model in the rendered template. It does NOT require
 * confidence when the contract omits it (e.g., chat).
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);

// Signals a page/composable that consumes an AI response.
const aiResponseConsumerPattern =
  /\b(?:aiChat|aiAnalysis|resumeAnalysis|coverLetter|aiMatch|interviewSession|aiProvider|aiResult|aiResponse|chatResponse|analysisResult)\b/giu;
// Template tags that render AI content.
const aiContentRenderPattern =
  /\b(?:aiChat|aiAnalysis|resumeAnalysis|aiContent|aiMessage|chatMessage|aiAnnotation|aiOverlay|aiReport|matchResult|interviewScore|skillConfidence)\b/giu;
// Provider + model provenance references in template.
const providerProvenancePattern = /\bprovider\b/giu;
const modelProvenancePattern = /\bmodel\b/giu;
// Confidence reference (optional but required where contract exposes it).
const confidencePattern = /\bconfidence\b/giu;
// Hoisted: AI surface detection (pathname) — avoids per-call regex compilation.
const AI_SURFACE_PATH_PATTERN =
  /\b(?:ai|interview|resume|cover-letter|coverLetter|skills|jobs|match)/iu;
// Hoisted: score surface detection (pathname).
const SCORE_SURFACE_PATH_PATTERN = /\b(?:interview|skill|confidence|score|match)\b/iu;
// Hoisted: confidence/score term detection in combined template+script.
const SCORE_SURFACE_CONTENT_PATTERN = /\b(?:confidence|score|interviewScore|skillConfidence)\b/iu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const extractScriptBlocks = (content: string): string => {
  const matches: string[] = [];
  const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gu;
  for (const match of content.matchAll(scriptPattern)) {
    matches.push(match[1] ?? "");
  }
  return matches.join("\n");
};

export const collectAiProvenanceViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  // Only scan pages/composables/components that touch AI.
  const isAiSurface =
    AI_SURFACE_PATH_PATTERN.test(filePath) || aiResponseConsumerPattern.test(content);
  if (!isAiSurface) return [];

  const template = extractTemplateBlocks(content);
  const script = extractScriptBlocks(content);
  const combined = `${template}\n${script}`;
  if (combined.length === 0) return [];

  // Does this surface render AI content?
  const rendersAiContent = aiContentRenderPattern.test(combined);
  if (!rendersAiContent) return [];

  const violations: ValidationViolation[] = [];
  const hasProvider = providerProvenancePattern.test(combined);
  const hasModel = modelProvenancePattern.test(combined);

  // Soften only for interview simulation chrome that deliberately uses local scripts
  // (not live provider responses). AIChatBubble is a live provenance surface — not exempt.
  const isSimulationChrome =
    filePath.includes("/InterviewChat.vue") ||
    filePath.includes("/InterviewConfigModal.vue") ||
    filePath.includes("/StudioSelector.vue");

  if (!hasProvider && !isSimulationChrome) {
    violations.push({
      filePath,
      line: 1,
      message: `AI surface renders AI content but does not surface the "provider" that produced it. Provenance is mandatory (see chatRouteResponseSchema). Display the provider in the annotation/overlay/report.`,
    });
  }

  if (!hasModel && !isSimulationChrome) {
    violations.push({
      filePath,
      line: 1,
      message: `AI surface renders AI content but does not surface the "model" that produced it. Provenance is mandatory (see chatRouteResponseSchema). Display the model id in the annotation/overlay/report.`,
    });
  }

  // Confidence is required on score-bearing surfaces (interview, skill-mapping).
  const isScoreSurface =
    SCORE_SURFACE_PATH_PATTERN.test(filePath) || SCORE_SURFACE_CONTENT_PATTERN.test(combined);
  const isComposable = filePath.includes("/composables/");
  if (isScoreSurface && !isComposable && !confidencePattern.test(combined) && !isSimulationChrome) {
    violations.push({
      filePath,
      line: 1,
      message: `Score-bearing AI surface (interview/skill-mapping/match) does not surface "confidence". Confidence is required so users know how to weight the assessment.`,
    });
  }

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectAiProvenanceViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "AI annotation provenance validation failed:",
    await collectViolations(),
    "AI annotation provenance validation passed.",
  );
}
