/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { AppTranslationSchema } from "~/locales/en-US";
import "vue-i18n";

declare module "vue-i18n" {
  interface DefineLocaleMessage extends AppTranslationSchema {}
}
