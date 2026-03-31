import baseCatalog from "./en-US/catalog";
import type { AppTranslationOverrides } from "./en-US";
import catalog from "./es-ES/catalog";
import { mergeLocaleCatalog } from "./merge";

const esES = mergeLocaleCatalog(baseCatalog, catalog) satisfies AppTranslationOverrides;

export default esES;
