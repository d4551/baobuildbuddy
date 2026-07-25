/**
 * Shared numeric literals for non-domain call sites.
 * Domain-specific values stay in http.ts / time.ts / score-thresholds / etc.
 * Definition SSOT: named consts here; consumers import — noMagicNumbers stays error.
 */

export const PERCENT_MAX = 100;
export const PERCENT_HIGH = 80;
export const PERCENT_MID = 50;
export const PERCENT_LOW = 20;

export const COUNT_TWO = 2;
export const COUNT_THREE = 3;
export const COUNT_FOUR = 4;
export const COUNT_FIVE = 5;
export const COUNT_SIX = 6;
export const COUNT_SEVEN = 7;
export const COUNT_EIGHT = 8;
export const COUNT_NINE = 9;
export const COUNT_TWELVE = 12;
export const COUNT_THIRTEEN = 13;
export const COUNT_FOURTEEN = 14;
export const COUNT_FIFTEEN = 15;
export const COUNT_SIXTEEN = 16;
export const COUNT_EIGHTEEN = 18;
export const COUNT_NINETEEN = 19;
export const COUNT_TWENTY = 20;
export const COUNT_TWENTY_TWO = 22;
export const COUNT_TWENTY_FIVE = 25;
export const COUNT_TWENTY_SIX = 26;
export const COUNT_TWENTY_EIGHT = 28;
export const COUNT_THIRTY = 30;
export const COUNT_THIRTY_ONE = 31;
export const COUNT_THIRTY_TWO = 32;
export const COUNT_THIRTY_FOUR = 34;
export const COUNT_THIRTY_FIVE = 35;
export const COUNT_THIRTY_SIX = 36;
export const COUNT_FORTY = 40;
export const COUNT_FORTY_FOUR = 44;
export const COUNT_FIFTY = 50;
export const COUNT_SEVENTY = 70;
export const COUNT_SEVENTY_ONE = 71;
export const COUNT_SEVENTY_EIGHT = 78;
export const COUNT_NINETY = 90;
export const COUNT_ONE_TWENTY = 120;
export const COUNT_ONE_TWENTY_SEVEN = 127;
export const COUNT_ONE_THIRTY_SEVEN = 137;
export const COUNT_ONE_FORTY = 140;
export const COUNT_ONE_FIFTY = 150;
export const COUNT_ONE_SIXTY_EIGHT = 168;
export const COUNT_ONE_SIXTY_NINE = 169;
export const COUNT_ONE_EIGHTY = 180;
export const COUNT_ONE_NINETY_TWO = 192;
export const COUNT_TWO_TWENTY = 220;
export const COUNT_TWO_TWENTY_ONE = 221;
export const COUNT_TWO_THIRTY_FIVE = 235;
export const COUNT_TWO_FORTY = 240;
export const COUNT_TWO_FIFTY = 250;
export const COUNT_TWO_FIFTY_ONE = 251;
export const COUNT_TWO_FIFTY_FOUR = 254;
export const COUNT_TWO_FIFTY_FIVE = 255;
export const COUNT_THREE_HUNDRED = 300;
export const COUNT_THREE_THIRTY_FOUR = 334;
export const COUNT_THREE_FIFTY_FOUR = 354;
export const COUNT_FOUR_HUNDRED = 400;
export const COUNT_FIVE_HUNDRED = 500;
export const COUNT_ONE_THOUSAND = 1000;
export const COUNT_TWO_THOUSAND = 2000;
export const COUNT_TWO_KILO = 2048;
export const COUNT_FOUR_KILO = 4096;

export const MS_TWO_SECONDS = 2_000;
export const MS_ONE_AND_HALF_SECONDS = 1_500;
export const MS_ONE_AND_EIGHT_SECONDS = 1_800;
export const MS_TWO_AND_HALF_SECONDS = 2_500;
export const MS_THREE_SECONDS = 3_000;
export const MS_FIVE_SECONDS = 5_000;
export const MS_TEN_SECONDS = 10_000;
export const MS_THIRTY_SECONDS = 30_000;
export const MS_TWO_MINUTES = 120_000;
export const MS_FIVE_MINUTES = 300_000;

export const BYTES_KILO = 1024;
export const BYTES_TWO_KILO = 2048;
export const BYTES_FOUR_KILO = 4096;
export const BYTES_MEGA = BYTES_KILO * BYTES_KILO;

/** Hex digit pad width for byte→hex string encoding (e.g. `toString(16).padStart(2, "0")`). */
export const HEX_BYTE_PAD_WIDTH = COUNT_TWO;
/** Base for `Number.toString(radix)` when encoding identifiers as base36. */
export const RADIX_BASE36 = COUNT_THIRTY_SIX;

export const RATIO_ONE_FIFTH = 0.2;
export const RATIO_ONE_QUARTER = 0.25;
export const RATIO_THREE_TENTHS = 0.3;
export const RATIO_HALF = 0.5;
export const RATIO_THREE_FIFTHS = 0.6;
export const RATIO_SEVEN_TENTHS = 0.7;
export const RATIO_FOUR_FIFTHS = 0.8;
export const RATIO_NINETY_FIVE_HUNDREDTHS = 0.95;
export const RATIO_ONE = 1.0;
export const RATIO_FIVE_QUARTERS = 1.25;
export const RATIO_THREE_HALVES = 1.5;
export const RATIO_TWO = 2.0;
export const RATIO_THREE = 3.0;

/** PDF magic bytes for `%PDF-1.7` fixture headers. */
export const PDF_MAGIC_PERCENT = 0x25;
export const PDF_MAGIC_P = 0x50;
export const PDF_MAGIC_D = 0x44;
export const PDF_MAGIC_F = 0x46;
export const PDF_MAGIC_HYPHEN = 0x2d;
export const PDF_MAGIC_ONE = 0x31;
export const PDF_MAGIC_DOT = 0x2e;
export const PDF_MAGIC_SEVEN = 0x37;

/** PNG signature leading bytes (IHDR magic prefix). */
export const PNG_SIGNATURE_BYTE_0 = COUNT_ONE_THIRTY_SEVEN;
export const PNG_SIGNATURE_BYTE_1 = PERCENT_HIGH;
export const PNG_SIGNATURE_BYTE_2 = COUNT_SEVENTY_EIGHT;
export const PNG_SIGNATURE_BYTE_3 = COUNT_SEVENTY_ONE;

/** JSON `\uXXXX` escape: hex digit count. */
export const UNICODE_ESCAPE_HEX_DIGITS = COUNT_FOUR;
/** JSON `\uXXXX` escape: full escape length including `\u` prefix. */
export const UNICODE_ESCAPE_SEQUENCE_LENGTH = COUNT_SIX;

/** Darwin kernel major → macOS marketing version offset used by Playwright. */
export const DARWIN_KERNEL_TO_MACOS_MAJOR_OFFSET = COUNT_NINE;
/** Darwin kernel majors mapped to fixed Playwright mac host tags. */
export const DARWIN_KERNEL_MAJOR_MOJAVE = COUNT_EIGHTEEN;
export const DARWIN_KERNEL_MAJOR_CATALINA = COUNT_NINETEEN;
