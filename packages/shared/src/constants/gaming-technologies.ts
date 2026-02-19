/**
 * Gaming technology constants
 */

export const GAMING_TECHNOLOGIES = {
  ENGINES: [
    "Unity",
    "Unreal Engine",
    "Godot",
    "Custom Engine",
    "CryEngine",
    "GameMaker Studio",
    "Construct 3",
    "RPG Maker",
    "Defold",
  ],
  LANGUAGES: ["C++", "C#", "JavaScript", "TypeScript", "Python", "Lua", "Go", "Rust", "GDScript"],
  GRAPHICS: ["DirectX", "OpenGL", "Vulkan", "Metal", "Shader Languages", "WebGL"],
  TOOLS: [
    "Maya",
    "Blender",
    "3ds Max",
    "Photoshop",
    "Substance",
    "Perforce",
    "Git",
    "Wwise",
    "FMOD",
  ],
  PLATFORMS: [
    "Steam",
    "Epic Games Store",
    "Console SDKs",
    "Mobile SDKs",
    "Meta Quest SDK",
    "WebXR",
  ],
} as const;

export const ALL_GAME_ENGINES = GAMING_TECHNOLOGIES.ENGINES;
export const ALL_PLATFORMS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Switch",
  "Mobile",
  "VR",
  "AR",
  "Web",
] as const;
export const ALL_GENRES = [
  "Action",
  "RPG",
  "Strategy",
  "Puzzle",
  "Simulation",
  "Sports",
  "Racing",
  "Shooter",
  "Platformer",
  "Horror",
  "MMORPG",
  "MOBA",
  "Battle Royale",
  "Roguelike",
  "Sandbox",
  "Adventure",
  "Fighting",
  "Survival",
  "Card Game",
  "Casual",
  "Indie",
] as const;
