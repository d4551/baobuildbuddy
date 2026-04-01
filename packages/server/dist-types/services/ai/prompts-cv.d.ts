/**
 * CV questionnaire: generate questions based on target role/studio
 */
export declare function cvQuestionnaireQuestionsPrompt(targetRole: string, studioName?: string, experienceLevel?: string): string;
/**
 * CV questionnaire: synthesize answers into ResumeData JSON
 */
export declare function cvQuestionnaireSynthesizePrompt(questionsAndAnswers: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
}>): string;
