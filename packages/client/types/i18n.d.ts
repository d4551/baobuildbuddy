import type { AppTranslationSchema } from "~/locales/en-US";
import "vue-i18n";

declare module "vue-i18n" {
  type DefineLocaleMessage = AppTranslationSchema;
}
