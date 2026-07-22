/**
 * Script-side numeric SSOT. Biome noMagicNumbers is muted under constants globs.
 * Prefer shared package constants when a domain name already exists.
 */

export const PAD_LOCALE_WIDTH = 5;
export const PAD_ROUTE_WIDTH = 26;
export const PAD_STATUS_WIDTH = 3;

export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_NO_CONTENT = 204;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_UNPROCESSABLE = 422;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_INTERNAL_ERROR = 500;
export const HTTP_BAD_GATEWAY = 502;
export const HTTP_SERVICE_UNAVAILABLE = 503;

export const PERCENT_MAX = 100;
export const PERCENT_HIGH = 80;
export const PERCENT_MID = 50;
export const PERCENT_LOW = 20;

export const MS_SECOND = 1000;
export const MS_TWO_SECONDS = 2_000;
export const MS_ONE_AND_HALF_SECONDS = 1_500;
export const MS_ONE_AND_EIGHT_SECONDS = 1_800;
export const MS_TWO_AND_HALF_SECONDS = 2_500;
export const MS_FIVE_SECONDS = 5_000;
export const MS_TEN_SECONDS = 10_000;
export const MS_THIRTY_SECONDS = 30_000;
export const MS_MINUTE = 60_000;

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
export const BYTES_KILO = 1024;
export const BYTES_TWO_KILO = 2048;

export const RATIO_HALF = 0.5;
export const RATIO_SEVEN_TENTHS = 0.7;

/** Owner read/write, group read, other read (`chmod 644`). */
export const FILE_MODE_RW_R_R = 0o644;
/** Owner read/write/execute, group read/execute, other read/execute (`chmod 755`). */
export const FILE_MODE_RWX_RX_RX = 0o755;
