/**
 * Shared numeric literals for non-domain call sites.
 * Domain-specific values stay in http.ts / time.ts / score-thresholds / etc.
 * Biome noMagicNumbers is muted under constants globs (definition SSOT).
 */

export const PERCENT_MAX = 100;
export const PERCENT_HIGH = 80;
export const PERCENT_MID = 50;
export const PERCENT_LOW = 20;

export const COUNT_THREE = 3;
export const COUNT_FOUR = 4;
export const COUNT_FIVE = 5;
export const COUNT_SIX = 6;
export const COUNT_SEVEN = 7;
export const COUNT_EIGHT = 8;
export const COUNT_TWELVE = 12;
export const COUNT_FIFTEEN = 15;
export const COUNT_SIXTEEN = 16;
export const COUNT_EIGHTEEN = 18;
export const COUNT_TWENTY = 20;
export const COUNT_TWENTY_FIVE = 25;
export const COUNT_THIRTY = 30;
export const COUNT_THIRTY_TWO = 32;
export const COUNT_THIRTY_FOUR = 34;
export const COUNT_THIRTY_SIX = 36;
export const COUNT_FORTY = 40;
export const COUNT_FIFTY = 50;
export const COUNT_SEVENTY = 70;
export const COUNT_ONE_TWENTY = 120;
export const COUNT_ONE_FIFTY = 150;
export const COUNT_TWO_FORTY = 240;
export const COUNT_TWO_FIFTY = 250;
export const COUNT_FIVE_HUNDRED = 500;

export const MS_TWO_SECONDS = 2_000;
export const MS_ONE_AND_HALF_SECONDS = 1_500;
export const MS_ONE_AND_EIGHT_SECONDS = 1_800;
export const MS_TWO_AND_HALF_SECONDS = 2_500;
export const MS_FIVE_SECONDS = 5_000;
export const MS_TEN_SECONDS = 10_000;
export const MS_THIRTY_SECONDS = 30_000;

export const BYTES_KILO = 1024;
export const BYTES_TWO_KILO = 2048;

export const RATIO_HALF = 0.5;
export const RATIO_SEVEN_TENTHS = 0.7;

export const HTTP_NO_CONTENT = 204;
