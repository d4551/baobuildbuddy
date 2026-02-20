import type { ResumeData } from "@bao/shared";
export interface CvQuestion {
    id: string;
    question: string;
    category: string;
}
export interface CvQuestionnaireConfig {
    targetRole: string;
    studioName?: string;
    experienceLevel?: string;
}
export declare class CvQuestionnaireService {
    generateQuestions(config: CvQuestionnaireConfig): Promise<CvQuestion[]>;
    synthesizeResume(questionsAndAnswers: Array<{
        id: string;
        question: string;
        answer: string;
        category: string;
    }>): Promise<Partial<ResumeData>>;
}
export declare const cvQuestionnaireService: CvQuestionnaireService;
