/** PDF header bytes for minimal test fixtures (`%PDF-1.7`). */
export const PDF_MAGIC_PERCENT = 0x25;
export const PDF_MAGIC_P = 0x50;
export const PDF_MAGIC_D = 0x44;
export const PDF_MAGIC_F = 0x46;
export const PDF_MAGIC_DASH = 0x2d;
export const PDF_MAGIC_ONE = 0x31;
export const PDF_MAGIC_DOT = 0x2e;
export const PDF_MAGIC_SEVEN = 0x37;

export const TEST_RESUME_PDF_BYTES = new Uint8Array([
  PDF_MAGIC_PERCENT,
  PDF_MAGIC_P,
  PDF_MAGIC_D,
  PDF_MAGIC_F,
  PDF_MAGIC_DASH,
  PDF_MAGIC_ONE,
  PDF_MAGIC_DOT,
  PDF_MAGIC_SEVEN,
]);
