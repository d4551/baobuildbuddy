/**
 * Gaming technology constants
 */

import { DEFAULT_JOB_TAXONOMY_KEYWORDS } from "./jobs-taxonomy";

const labelsForCategory = (
  category: (typeof DEFAULT_JOB_TAXONOMY_KEYWORDS)[number]["category"],
): string[] =>
  DEFAULT_JOB_TAXONOMY_KEYWORDS.filter((entry) => entry.category === category).map(
    (entry) => entry.label,
  );

export const GAMING_TECHNOLOGIES = {
  ENGINES: ["Unity", "Unreal Engine", "Godot", "CryEngine"],
  LANGUAGES: ["C++", "C#", "JavaScript", "Python", "Lua"],
  GRAPHICS: ["DirectX", "OpenGL", "Vulkan", "Metal"],
  TOOLS: ["Maya", "Blender", "3ds Max", "Photoshop", "Git", "Perforce", "Jira"],
  PLATFORMS: ["Steam", "PlayStation", "Xbox", "Switch", "Mobile", "VR", "AR", "Web"],
} as const;

export const ALL_GAME_ENGINES = GAMING_TECHNOLOGIES.ENGINES;
export const ALL_PLATFORMS = labelsForCategory("platform");
export const ALL_GENRES = labelsForCategory("genre");
