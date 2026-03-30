import {
  asRecord,
  asString,
  isCoverLetterTemplate,
  isRecord,
  COVER_LETTER_DEFAULT_TEMPLATE,
  type CoverLetterData,
} from "@bao/shared";

export const toCoverLetterData = (value: unknown): CoverLetterData | null => {
  if (!isRecord(value)) return null;
  const company = asString(value.company);
  const position = asString(value.position);
  if (!(company && position)) return null;

  const contentRecord = asRecord(value.content) ?? {};
  const content: CoverLetterData["content"] = {};
  for (const [key, entry] of Object.entries(contentRecord)) {
    if (typeof entry === "string") {
      content[key] = entry;
    }
  }
  const templateValue = asString(value.template);

  return {
    id: asString(value.id),
    company,
    position,
    jobInfo: asRecord(value.jobInfo),
    personalInfo: asRecord(value.personalInfo),
    companyResearch: asRecord(value.companyResearch),
    content,
    template: isCoverLetterTemplate(templateValue) ? templateValue : COVER_LETTER_DEFAULT_TEMPLATE,
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};
