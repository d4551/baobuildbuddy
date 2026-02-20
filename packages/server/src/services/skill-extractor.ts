interface ExtractedSkill {
  name: string;
  category:
    | "engines"
    | "programming"
    | "design"
    | "art"
    | "tools"
    | "gamingTech"
    | "esports"
    | "transferable";
  confidence: number;
  proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
  source: string;
}

interface SkillGapAnalysis {
  matchPercentage: number;
  matched: string[];
  missing: string[];
  extra: string[];
  recommendations: string[];
}

const SKILL_PATTERNS: Record<string, Array<{ pattern: RegExp; name: string }>> = {
  engines: [
    { pattern: /\bUnity\b/i, name: "Unity" },
    { pattern: /\bUnreal\s*Engine\s*[45]?\b/i, name: "Unreal Engine" },
    { pattern: /\bGodot\b/i, name: "Godot" },
    { pattern: /\bCryEngine\b/i, name: "CryEngine" },
    { pattern: /\bSource\s*2?\b/i, name: "Source Engine" },
    { pattern: /\bFrostbite\b/i, name: "Frostbite" },
    { pattern: /\bid\s*Tech\b/i, name: "id Tech" },
    { pattern: /\bRPG\s*Maker\b/i, name: "RPG Maker" },
    { pattern: /\bGameMaker\b/i, name: "GameMaker" },
    { pattern: /\bRen'?Py\b/i, name: "Ren'Py" },
    { pattern: /\bPhaser\b/i, name: "Phaser" },
    { pattern: /\bCocos2d/i, name: "Cocos2d" },
  ],
  programming: [
    { pattern: /\bC\+\+\b/, name: "C++" },
    { pattern: /\bC#\b/, name: "C#" },
    { pattern: /\bPython\b/i, name: "Python" },
    { pattern: /\bLua\b/i, name: "Lua" },
    { pattern: /\bTypeScript\b/i, name: "TypeScript" },
    { pattern: /\bJavaScript\b/i, name: "JavaScript" },
    { pattern: /\bRust\b/i, name: "Rust" },
    { pattern: /\bGDScript\b/i, name: "GDScript" },
    { pattern: /\bHLSL\b/i, name: "HLSL" },
    { pattern: /\bGLSL\b/i, name: "GLSL" },
    { pattern: /\bJava\b(?!\s*Script)/i, name: "Java" },
    { pattern: /\bSwift\b/i, name: "Swift" },
    { pattern: /\bKotlin\b/i, name: "Kotlin" },
    { pattern: /\bGo\b(?:lang)?\b/i, name: "Go" },
  ],
  design: [
    { pattern: /\blevel\s*design/i, name: "Level Design" },
    { pattern: /\bgame\s*design/i, name: "Game Design" },
    { pattern: /\bsystems?\s*design/i, name: "Systems Design" },
    { pattern: /\bnarrative\s*design/i, name: "Narrative Design" },
    { pattern: /\bquest\s*design/i, name: "Quest Design" },
    { pattern: /\bUX\s*design/i, name: "UX Design" },
    { pattern: /\bUI\s*design/i, name: "UI Design" },
    { pattern: /\bworld\s*build/i, name: "World Building" },
    { pattern: /\bcombat\s*design/i, name: "Combat Design" },
    { pattern: /\beconomy\s*design/i, name: "Economy Design" },
  ],
  art: [
    { pattern: /\b3D\s*model/i, name: "3D Modeling" },
    { pattern: /\bconcept\s*art/i, name: "Concept Art" },
    { pattern: /\btextur/i, name: "Texturing" },
    { pattern: /\brigging\b/i, name: "Rigging" },
    { pattern: /\banimat(?:ion|e|or)/i, name: "Animation" },
    { pattern: /\bVFX\b/i, name: "VFX" },
    { pattern: /\benvironment\s*art/i, name: "Environment Art" },
    { pattern: /\bcharacter\s*art/i, name: "Character Art" },
    { pattern: /\bpixel\s*art/i, name: "Pixel Art" },
    { pattern: /\btech(?:nical)?\s*art/i, name: "Technical Art" },
  ],
  tools: [
    { pattern: /\bMaya\b/i, name: "Maya" },
    { pattern: /\bBlender\b/i, name: "Blender" },
    { pattern: /\b3ds\s*Max\b/i, name: "3ds Max" },
    { pattern: /\bPhotoshop\b/i, name: "Photoshop" },
    { pattern: /\bSubstance/i, name: "Substance" },
    { pattern: /\bHoudini\b/i, name: "Houdini" },
    { pattern: /\bZBrush\b/i, name: "ZBrush" },
    { pattern: /\bPerforce\b/i, name: "Perforce" },
    { pattern: /\bGit\b/, name: "Git" },
    { pattern: /\bJira\b/i, name: "Jira" },
    { pattern: /\bFigma\b/i, name: "Figma" },
    { pattern: /\bAfter\s*Effects\b/i, name: "After Effects" },
    { pattern: /\bSpine\b/i, name: "Spine" },
    { pattern: /\bWwise\b/i, name: "Wwise" },
    { pattern: /\bFMOD\b/i, name: "FMOD" },
  ],
  gamingTech: [
    { pattern: /\bDirectX\b/i, name: "DirectX" },
    { pattern: /\bOpenGL\b/i, name: "OpenGL" },
    { pattern: /\bVulkan\b/i, name: "Vulkan" },
    { pattern: /\bMetal\b/, name: "Metal" },
    { pattern: /\bPhysX\b/i, name: "PhysX" },
    { pattern: /\bHavok\b/i, name: "Havok" },
    { pattern: /\bshader/i, name: "Shaders" },
    { pattern: /\brendering/i, name: "Rendering" },
    { pattern: /\bmultiplayer/i, name: "Multiplayer Networking" },
    { pattern: /\bnetcode\b/i, name: "Netcode" },
    { pattern: /\bprocedural\s*gen/i, name: "Procedural Generation" },
    { pattern: /\bray\s*trac/i, name: "Ray Tracing" },
  ],
  esports: [
    { pattern: /\btournament/i, name: "Tournament Organization" },
    { pattern: /\bcompetitive\s*gaming/i, name: "Competitive Gaming" },
    { pattern: /\bstream(?:ing|er)/i, name: "Streaming" },
    { pattern: /\bcoach(?:ing)?\b/i, name: "Coaching" },
    { pattern: /\bbroadcast/i, name: "Broadcasting" },
    { pattern: /\bcontent\s*creat/i, name: "Content Creation" },
    { pattern: /\besports?\b/i, name: "Esports" },
    { pattern: /\bcommunity\s*manag/i, name: "Community Management" },
  ],
  transferable: [
    { pattern: /\bleadership\b/i, name: "Leadership" },
    { pattern: /\bproject\s*management/i, name: "Project Management" },
    { pattern: /\bagile\b/i, name: "Agile" },
    { pattern: /\bscrum\b/i, name: "Scrum" },
    { pattern: /\bcommunication/i, name: "Communication" },
    { pattern: /\bproblem.solving/i, name: "Problem Solving" },
    { pattern: /\banalytics?\b/i, name: "Analytics" },
    { pattern: /\bteamwork\b/i, name: "Teamwork" },
    { pattern: /\bmentoring\b/i, name: "Mentoring" },
    { pattern: /\bcross.functional/i, name: "Cross-functional Collaboration" },
  ],
};

const GAMING_TO_PROFESSIONAL: Record<string, string> = {
  "Guild Leader": "Team Leadership & Project Management",
  "Raid Coordinator": "Event Planning & Resource Management",
  Streamer: "Content Creation & Digital Marketing",
  Modder: "Software Development & Problem Solving",
  "Beta Tester": "Quality Assurance & Bug Reporting",
  "Game Master": "Community Management & Conflict Resolution",
  "Clan Manager": "Community Building & Team Leadership",
  "Tournament Player": "Performance Under Pressure & Strategic Thinking",
  "Content Creator": "Digital Marketing & Brand Building",
  "Game Reviewer": "Technical Writing & Critical Analysis",
  Speedrunner: "Analytical Thinking & Optimization",
  "Map Maker": "Level Design & Spatial Reasoning",
  "Server Admin": "System Administration & Community Management",
  "Esports Coach": "Leadership & Performance Analysis",
  "Wiki Editor": "Technical Documentation & Research",
};

export class SkillExtractor {
  extractSkills(text: string): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    const seen = new Set<string>();

    for (const [category, patterns] of Object.entries(SKILL_PATTERNS)) {
      for (const { pattern, name } of patterns) {
        if (seen.has(name)) continue;
        const match = text.match(pattern);
        if (match) {
          seen.add(name);
          const proficiency = this.detectProficiency(text, name);
          const contextStart = Math.max(0, (match.index || 0) - 30);
          const contextEnd = Math.min(text.length, (match.index || 0) + match[0].length + 30);
          skills.push({
            name,
            category: category as ExtractedSkill["category"],
            confidence: category === "transferable" ? 0.7 : 0.9,
            proficiency,
            source: text.slice(contextStart, contextEnd).trim(),
          });
        }
      }
    }

    return skills;
  }

  extractFromJobDescription(description: string): {
    required: ExtractedSkill[];
    preferred: ExtractedSkill[];
  } {
    const allSkills = this.extractSkills(description);

    const requiredPatterns = /\b(required|must\s+have|essential|minimum|mandatory)\b/i;
    const preferredPatterns = /\b(preferred|nice\s+to\s+have|bonus|plus|desired|optional)\b/i;

    const sentences = description.split(/[.!?\n]+/);
    const requiredSentences = new Set<number>();
    const preferredSentences = new Set<number>();

    sentences.forEach((s, i) => {
      if (requiredPatterns.test(s)) requiredSentences.add(i);
      if (preferredPatterns.test(s)) preferredSentences.add(i);
    });

    const required: ExtractedSkill[] = [];
    const preferred: ExtractedSkill[] = [];

    for (const skill of allSkills) {
      const skillSentenceIdx = sentences.findIndex((s) => s.includes(skill.source.slice(0, 20)));
      if (preferredSentences.has(skillSentenceIdx)) {
        preferred.push(skill);
      } else {
        required.push(skill);
      }
    }

    return { required, preferred };
  }

  compareSkills(userSkills: ExtractedSkill[], jobSkills: ExtractedSkill[]): SkillGapAnalysis {
    const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase()));
    const jobSkillNames = new Set(jobSkills.map((s) => s.name.toLowerCase()));

    const matched = [...jobSkillNames].filter((s) => userSkillNames.has(s));
    const missing = [...jobSkillNames].filter((s) => !userSkillNames.has(s));
    const extra = [...userSkillNames].filter((s) => !jobSkillNames.has(s));

    const matchPercentage =
      jobSkillNames.size > 0 ? Math.round((matched.length / jobSkillNames.size) * 100) : 0;

    const recommendations = missing.map((skill) => {
      const jobSkill = jobSkills.find((s) => s.name.toLowerCase() === skill);
      return `Learn ${jobSkill?.name || skill}: Focus on ${jobSkill?.category || "general"} skills to improve your match.`;
    });

    return { matchPercentage, matched, missing, extra, recommendations };
  }

  mapGamingToCareer(gamingExperiences: string[]): Array<{ gaming: string; professional: string }> {
    const mappings: Array<{ gaming: string; professional: string }> = [];

    for (const exp of gamingExperiences) {
      for (const [gaming, professional] of Object.entries(GAMING_TO_PROFESSIONAL)) {
        if (exp.toLowerCase().includes(gaming.toLowerCase())) {
          mappings.push({ gaming: exp, professional });
        }
      }
      // Fallback: if no direct match, extract general transferable skills
      if (!mappings.find((m) => m.gaming === exp)) {
        const extracted = this.extractSkills(exp);
        const transferable = extracted.filter((s) => s.category === "transferable");
        if (transferable.length > 0) {
          mappings.push({ gaming: exp, professional: transferable.map((s) => s.name).join(", ") });
        }
      }
    }

    return mappings;
  }

  private detectProficiency(text: string, skillName: string): ExtractedSkill["proficiency"] {
    const surroundingText = this.getSurroundingText(text, skillName, 100).toLowerCase();

    if (
      /\b(expert|mastery|extensive|10\+?\s*years?|senior|lead|principal|architect)\b/i.test(
        surroundingText,
      )
    ) {
      return "expert";
    }
    if (/\b(advanced|strong|deep|5\+?\s*years?|senior|proficient)\b/i.test(surroundingText)) {
      return "advanced";
    }
    if (
      /\b(intermediate|experience\s+with|worked\s+with|3\+?\s*years?|familiar)\b/i.test(
        surroundingText,
      )
    ) {
      return "intermediate";
    }
    if (/\b(beginner|learning|basic|introduct|exposure|coursework)\b/i.test(surroundingText)) {
      return "beginner";
    }
    return "intermediate"; // default
  }

  private getSurroundingText(text: string, keyword: string, radius: number): string {
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) return "";
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + keyword.length + radius);
    return text.slice(start, end);
  }
}

export const skillExtractor = new SkillExtractor();
