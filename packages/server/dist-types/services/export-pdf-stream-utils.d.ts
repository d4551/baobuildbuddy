/**
 * Decode all PDF stream bodies (inflated when compressed) into one latin1 string.
 */
export declare const extractPdfContentStreams: (pdfBytes: Uint8Array) => string;
/**
 * Build a pdf-lib fill operator needle for an RGB triple (e.g. "0.62 0.18 0.42 rg").
 */
export declare const pdfRgbFillOperator: (color: {
    readonly r: number;
    readonly g: number;
    readonly b: number;
}) => string;
/**
 * True when inflated PDF streams include the exact fill operator for the color.
 */
export declare const pdfStreamsContainRgbFill: (pdfBytes: Uint8Array, color: {
    readonly r: number;
    readonly g: number;
    readonly b: number;
}) => boolean;
