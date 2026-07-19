import type { AppTranslationOverrides, AppTranslationSchema } from "./en-US";
import baseCatalog from "./en-US/catalog";
import catalog from "./es-ES/catalog";
import { mergeLocaleCatalog } from "./merge";

const esES = mergeLocaleCatalog<AppTranslationSchema>(
  baseCatalog,
  catalog,
) satisfies AppTranslationOverrides;

export default esES;
