import type { CoverLetterPayload, CoverLetterUserProfile } from "./export-service-contracts";
export declare function exportCoverLetterDocxDocument(coverLetter: CoverLetterPayload, userProfile: CoverLetterUserProfile): Promise<Uint8Array>;
