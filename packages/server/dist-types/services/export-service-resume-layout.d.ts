import { type ResumeTemplate } from "@bao/shared";
import { type ResumeRenderContext, type ResumeTemplateDefinition, type WrappedTextOptions } from "./export-service-contracts";
export declare function resolveResumePdfTemplate(requestedTemplate: string | undefined, resumeTemplate: ResumeTemplate | undefined): ResumeTemplateDefinition;
export declare function applyResumeBackground(context: ResumeRenderContext, page?: import("pdf-lib").PDFPage): void;
export declare function ensureResumeSpace(context: ResumeRenderContext, requiredSpace: number): void;
export declare function drawResumeWrappedLine(context: ResumeRenderContext, options: WrappedTextOptions, line: string): void;
export declare function drawResumeWrappedText(context: ResumeRenderContext, options: WrappedTextOptions): void;
export declare function createResumeContext(template: ResumeTemplateDefinition): Promise<ResumeRenderContext>;
export declare function renderResumeSectionHeader(context: ResumeRenderContext, title: string): void;
