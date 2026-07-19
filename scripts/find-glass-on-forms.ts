import { collectProjectFileEntries } from "./utils/validation-helpers";

const files = await collectProjectFileEntries({
  scanRoots: ["packages/client"],
  allowedExtensions: new Set([".vue"]),
});

const formTags = /<(form|input|select|textarea|table)\b/i;
const glassClass = /SURFACE_GLASS_CARD_CLASS/;

const hits: { file: string; reason: string }[] = [];
for (const { filePath, content } of files) {
  if (!glassClass.test(content)) continue;
  const hasFormTag = formTags.test(content);
  const isNamedFormCard = /FormCard|FormPanel|ApplyForm|Settings|ConfigModal|Editor|PersonalInfoForm|SkillsEditor|EducationList|ExperienceList|ResumeProjectsEditor/i.test(filePath);
  if (hasFormTag || isNamedFormCard) {
    const tags: string[] = [];
    if (hasFormTag) {
      const tagSet = new Set<string>();
      for (const m of content.matchAll(/<(form|input|select|textarea|table)\b/gi)) {
        tagSet.add(m[1].toLowerCase());
      }
      tags.push(...tagSet);
    }
    hits.push({ file: filePath, reason: tags.length > 0 ? `contains ${tags.join(",")}` : "named form/settings component" });
  }
}

for (const hit of hits) {
  console.log(`${hit.file}: ${hit.reason}`);
}
console.log(`Total: ${hits.length}`);
