/**
 * Form field analysis prompt for AI-powered smart selectors in RPA automation.
 * Analyzes a job application page's HTML to map field names to selectors and infer answers.
 */
export function formFieldAnalysisPrompt(
  pageHtml: string,
  fieldsNeeded: string[],
  candidateContext: string,
): string {
  return `Analyze this job application page HTML and return JSON with selector candidates plus inferred answers for non-core fields.

Fields needed: ${fieldsNeeded.join(", ")}

Candidate context:
${candidateContext}

HTML (form-relevant elements only):
${pageHtml}

Requirements:
1. In selectorMap, include arrays of CSS selectors ordered by specificity.
2. Always include selectorMap entries for the requested core fields when you can identify them.
3. In fieldAnswers, include only extra non-core application questions when the answer can be derived from the candidate context or the existingAnswers section.
4. For yes/no controls, return lowercase "yes" or "no".
5. For dropdowns, radios, and checkboxes, return the exact visible option label whenever possible.
6. Keep fieldAnswers concise and factual. Do not invent experience, authorization, or demographic information.
7. Do not include resume, coverLetter, or submit in fieldAnswers.

Return ONLY valid JSON with this structure:
{
  "selectorMap": {
    "fullName": ["#full-name", "input[name='name']", "input[aria-label='Full name']"],
    "email": ["#email", "input[type='email']", "input[name='email']"],
    "phone": ["input[type='tel']", "input[name='phone']"],
    "resume": ["input[type='file']", "input[name='resume']"],
    "coverLetter": ["textarea[name='cover_letter']", "textarea#cover-letter"],
    "submit": ["button[type='submit']", "input[type='submit']"],
    "workAuthorization": ["select[name='work_authorization']"],
    "portfolioLink": ["input[name='portfolio_url']"]
  },
  "fieldAnswers": {
    "workAuthorization": "yes",
    "portfolioLink": "https://portfolio.example.com"
  }
}

Prioritize selectors with unique IDs, then name attributes, then aria-labels, then label-associated selectors, then type-based fallbacks.`;
}
