import type { AppTranslationOverrides, AppTranslationSchema } from "./en-US";
import baseCatalog from "./en-US/catalog";
import catalog from "./ja-JP/catalog";
import { mergeLocaleCatalog } from "./merge";

const jaJP = mergeLocaleCatalog<AppTranslationSchema>(
  baseCatalog,
  catalog,
) satisfies AppTranslationOverrides;

export default jaJP;
