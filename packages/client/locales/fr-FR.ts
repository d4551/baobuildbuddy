import baseCatalog from "./en-US/catalog";
import type { AppTranslationOverrides, AppTranslationSchema } from "./en-US";
import catalog from "./fr-FR/catalog";
import { mergeLocaleCatalog } from "./merge";

const frFR = mergeLocaleCatalog<AppTranslationSchema>(
  baseCatalog,
  catalog,
) satisfies AppTranslationOverrides;

export default frFR;
