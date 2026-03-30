import { join } from "node:path";
import type { ResumeData } from "@bao/shared";
import { settle } from "@bao/shared";
import { exportService } from "../export-service";

const collectResumeHeaderLines = (resume: ResumeData): string[] => {
  const lines: string[] = [];
  const personalInfo = resume.personalInfo;

  if (resume.name) {
    lines.push(resume.name);
  }
  if (personalInfo?.name && personalInfo.name !== resume.name) {
    lines.push(personalInfo.name);
  }

  const contactLines = [
    personalInfo?.email,
    personalInfo?.phone,
    personalInfo?.location,
    personalInfo?.website,
    personalInfo?.linkedIn,
    personalInfo?.github,
    personalInfo?.portfolio,
  ].filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  if (contactLines.length > 0) {
    lines.push(contactLines.join(" | "));
  }

  return lines;
};

const appendSection = (lines: string[], title: string, entries: string[]): void => {
  if (entries.length === 0) {
    return;
  }

  lines.push("", title, ...entries);
};

const collectResumeExperienceLines = (resume: ResumeData): string[] => {
  const lines: string[] = [];

  for (const experience of resume.experience ?? []) {
    const headerParts = [experience.title, experience.company].filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );
    if (headerParts.length > 0) {
      lines.push(headerParts.join(" - "));
    }
    if (experience.description?.trim()) {
      lines.push(experience.description.trim());
    }
    for (const achievement of experience.achievements ?? []) {
      if (achievement.trim().length > 0) {
        lines.push(`- ${achievement.trim()}`);
      }
    }
  }

  return lines;
};

const collectResumeEducationLines = (resume: ResumeData): string[] => {
  const lines: string[] = [];

  for (const education of resume.education ?? []) {
    const headerParts = [education.degree, education.field, education.school].filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );
    if (headerParts.length > 0) {
      lines.push(headerParts.join(" - "));
    }
  }

  return lines;
};

const collectResumeSkillSections = (
  resume: ResumeData,
): Array<{ title: string; lines: string[] }> => {
  const skillSections = [
    ["Technical Skills", resume.skills?.technical],
    ["Soft Skills", resume.skills?.soft],
    ["Gaming Skills", resume.skills?.gaming],
  ] as const;

  return skillSections.reduce<Array<{ title: string; lines: string[] }>>(
    (sections, [title, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        sections.push({ title, lines: [values.join(", ")] });
      }
      return sections;
    },
    [],
  );
};

const serializeResumeUploadFallback = (resume: ResumeData): string => {
  const lines = collectResumeHeaderLines(resume);
  appendSection(lines, "Summary", resume.summary?.trim() ? [resume.summary.trim()] : []);
  appendSection(lines, "Experience", collectResumeExperienceLines(resume));
  appendSection(lines, "Education", collectResumeEducationLines(resume));
  for (const section of collectResumeSkillSections(resume)) {
    appendSection(lines, section.title, section.lines);
  }
  return lines.join("\n").trim();
};

export const createResumeUploadArtifact = async (
  runArtifactDir: string,
  resume: ResumeData,
): Promise<string | undefined> => {
  const pdfResult = await settle(exportService.exportResumePDF(resume, resume.template));
  if (pdfResult.status === "fulfilled") {
    const pdfPath = join(runArtifactDir, "resume.pdf");
    const writePdfResult = await settle(Bun.write(pdfPath, pdfResult.value));
    if (writePdfResult.status === "fulfilled") {
      return pdfPath;
    }
  }

  const fallbackResumePath = join(runArtifactDir, "resume.txt");
  const fallbackResume = serializeResumeUploadFallback(resume);
  const writeFallbackResult = await settle(Bun.write(fallbackResumePath, fallbackResume));
  if (writeFallbackResult.status === "fulfilled") {
    return fallbackResumePath;
  }
};
