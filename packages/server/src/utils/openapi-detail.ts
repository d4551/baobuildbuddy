/**
 * OpenAPI operation detail SSOT — every documented route must ship tags + description.
 */
export const openapiDetail = (tag: string, description: string) => {
  const trimmed = description.trim();
  if (tag.length === 0) {
    throw new Error("openapiDetail requires a non-empty tag");
  }
  if (trimmed.length < 12) {
    throw new Error(`openapiDetail description too short for tag "${tag}"`);
  }
  return {
    tags: [tag],
    description: trimmed,
  };
};
