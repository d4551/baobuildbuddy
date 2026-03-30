import { type CoverLetterPayload, type CoverLetterUserProfile } from "./export-service-contracts";
export declare function exportCoverLetterPdf(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
