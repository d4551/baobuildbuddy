const resumeBuildPage = {
  resumeBuildPage: {
    title: "Build Your CV with AI",
    subtitle:
      "Tell us your target role and studio. We will generate tailored questions and create your resume.",
    seoTitle: "AI CV Builder",
    seoDescription:
      "Generate role-specific CV questions, answer them step-by-step, and synthesize a ready-to-edit resume.",
    progressAria: "Resume builder progress",
    generatingLabel: "Generating tailored questions...",
    synthesizingLabel: "Creating your resume...",
    toasts: {
      resumeCreated: "Resume created",
    },
    errors: {
      emptyQuestions: "No questions were generated. Please try again.",
      generateQuestions: "Failed to generate questions",
      createResume: "Failed to create resume",
    },
    experienceLevels: {
      any: "Any",
      entry: "Entry",
      mid: "Mid",
      senior: "Senior",
      lead: "Lead",
    },
    target: {
      title: "Target Role & Studio",
      description:
        "What role are you targeting? Optionally select a studio to tailor the questions.",
      roleLegend: "Target Role",
      roleLabel: "e.g. Game Designer at AAA studio, Junior Programmer",
      rolePlaceholder: "e.g. Game Designer at AAA studio",
      roleAria: "Target role",
      studioLegend: "Studio (optional)",
      studioLabel: "Pick a studio to tailor questions",
      studioAria: "Studio selection",
      noStudioOption: "None selected",
      studioNameLabel: "Or type studio name",
      studioNamePlaceholder: "e.g. Epic Games",
      studioNameAria: "Custom studio name",
      experienceLegend: "Experience Level (optional)",
      experienceAria: "Experience level",
      generateButton: "Generate Questions",
      generateAria: "Generate tailored CV questions",
    },
    questions: {
      title: "Question {current} of {total}",
      changeTargetButton: "Change target",
      changeTargetAria: "Return to target selection",
      answerPlaceholder: "Your answer for: {question}",
      answerAria: "Answer for question: {question}",
      backButton: "Back",
      backAria: "Previous question",
      nextButton: "Next",
      nextAria: "Next question",
      createResumeButton: "Create Resume",
    },
  },
} as const;

export default resumeBuildPage;
