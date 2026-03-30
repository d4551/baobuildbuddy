/**
 * CV questionnaire: generate questions based on target role/studio
 */
export function cvQuestionnaireQuestionsPrompt(
  targetRole: string,
  studioName?: string,
  experienceLevel?: string,
): string {
  return `Generate 8-12 interview-style questions to build a CV/resume for a game industry professional.

Target Role: ${targetRole}
${studioName ? `Target Studio: ${studioName}` : ""}
${experienceLevel ? `Experience Level: ${experienceLevel}` : ""}

Generate questions that gather:
1. Personal info: name, contact, location (1-2 questions)
2. Professional summary / career goals (1-2 questions)
3. Work experience: roles, companies, achievements, technologies (2-3 questions)
4. Education: degree, school, field, relevant coursework (1-2 questions)
5. Skills: technical, soft, gaming-specific (1-2 questions)
6. Projects: shipped titles, side projects, contributions (1-2 questions)
7. Gaming experience: engines, genres, achievements, passion (1-2 questions)

Return a JSON array: [{"id": "q1", "question": "...", "category": "personal"|"summary"|"experience"|"education"|"skills"|"projects"|"gaming"}]`;
}

/**
 * CV questionnaire: synthesize answers into ResumeData JSON
 */
export function cvQuestionnaireSynthesizePrompt(
  questionsAndAnswers: Array<{ id: string; question: string; answer: string; category: string }>,
): string {
  const qaText = questionsAndAnswers
    .map((qa) => `Q (${qa.category}): ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  return `Synthesize these Q&A responses into a structured resume (ResumeData) JSON object.

Questions and Answers:
${qaText}

Return ONLY valid JSON matching this structure (use null/undefined for missing fields):
{
  "personalInfo": {"name": string, "email": string, "phone": string, "location": string, "linkedIn": string, "portfolio": string},
  "summary": string,
  "experience": [{"title": string, "company": string, "startDate": string, "endDate": string, "location": string, "description": string, "achievements": string[]}],
  "education": [{"degree": string, "field": string, "school": string, "year": string, "gpa": string}],
  "skills": {"technical": string[], "soft": string[], "gaming": string[]},
  "projects": [{"title": string, "description": string, "technologies": string[], "link": string}],
  "gamingExperience": {"gameEngines": string, "platforms": string, "genres": string, "shippedTitles": string}
}

Extract and structure all information from the answers. Use empty arrays/objects for missing sections. Return only the JSON, no markdown.`;
}
