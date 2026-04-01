import { type CoverLetterPayload, type CoverLetterUserProfile } from "./docx-export-contracts";
export declare function exportCoverLetterDocxDocument(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
