import type { BrandSettings, BrandThemePalette } from "@bao/shared/types/settings-contracts";
import { watchEffect } from "vue";

const BRAND_PREVIEW_STYLE_ELEMENT_ID = "bao-brand-preview-styles";

function paletteRules(selector: string, palette: BrandThemePalette, brand: BrandSettings): string {
  return `${selector} {
  --color-base-100: ${palette.base100};
  --color-base-200: ${palette.base200};
  --color-base-300: ${palette.base300};
  --color-base-content: ${palette.baseContent};
  --color-primary: ${palette.primary};
  --color-primary-content: ${palette.primaryContent};
  --color-secondary: ${palette.secondary};
  --color-secondary-content: ${palette.secondaryContent};
  --color-accent: ${palette.accent};
  --color-accent-content: ${palette.accentContent};
  --color-neutral: ${palette.neutral};
  --color-neutral-content: ${palette.neutralContent};
  --color-info: ${palette.info};
  --color-info-content: ${palette.infoContent};
  --color-success: ${palette.success};
  --color-success-content: ${palette.successContent};
  --color-warning: ${palette.warning};
  --color-warning-content: ${palette.warningContent};
  --color-error: ${palette.error};
  --color-error-content: ${palette.errorContent};
  --radius-selector: ${palette.radiusSelector};
  --radius-field: ${palette.radiusField};
  --radius-box: ${palette.radiusBox};
  --size-selector: ${palette.sizeSelector};
  --size-field: ${palette.sizeField};
  --border: ${palette.border};
  --depth: ${palette.depth};
  --noise: ${palette.noise};
  --brand-font-display: ${brand.typography.displayFontFamily};
  --brand-font-body: ${brand.typography.bodyFontFamily};
  --brand-font-mono: ${brand.typography.monoFontFamily};
  background-color: ${palette.base100};
  border-color: ${palette.secondary};
  color: ${palette.baseContent};
  font-family: var(--brand-font-body);
}`;
}

/**
 * Publishes brand preview rules into a document stylesheet so Vue templates
 * avoid `:style` bindings for dynamic brand colors.
 */
export function useBrandPreviewStyles(getBrand: () => BrandSettings): void {
  if (!import.meta.client) {
    return;
  }

  watchEffect((onCleanup) => {
    const brand = getBrand();
    let styleElement = document.getElementById(BRAND_PREVIEW_STYLE_ELEMENT_ID);
    if (!(styleElement instanceof HTMLStyleElement)) {
      styleElement = document.createElement("style");
      styleElement.id = BRAND_PREVIEW_STYLE_ELEMENT_ID;
      document.head.append(styleElement);
    }

    styleElement.textContent = `
.brand-swatch-light {
  background: linear-gradient(135deg, ${brand.lightTheme.base100} 0%, ${brand.lightTheme.base200} 50%, ${brand.lightTheme.primary} 100%);
}
.brand-swatch-dark {
  background: linear-gradient(135deg, ${brand.darkTheme.base100} 0%, ${brand.darkTheme.base200} 50%, ${brand.darkTheme.primary} 100%);
}
${paletteRules(".brand-preview-surface-light", brand.lightTheme, brand)}
${paletteRules(".brand-preview-surface-dark", brand.darkTheme, brand)}
`;

    onCleanup(() => {
      styleElement?.remove();
    });
  });
}
