const settingsbrand = {
  settings: {
    brand: {
      title: "Brand Control Plane",
      subtitle:
        "White-label identity, typography, semantic theme tokens, and locale copy from one persisted configuration.",
      infoTitle: "One contract for every brand surface",
      infoDescription:
        "Preview identity, typography, theme tokens, and localized copy before publishing changes across the product.",
      previewEyebrow: "Live preview",
      previewTitle: "Brand surface preview",
      previewSubtitle:
        "Validate logo, tone, token contrast, and copy overrides before you save the next variant.",
      previewLogoAlt: "{brand} logo preview",
      previewPrimaryAction: "Open workspace",
      previewSecondaryAction: "Review copy",
      editorTabsAria: "Brand editor sections",
      nameLegend: "Product name",
      nameAria: "Product name",
      assistantNameLegend: "Assistant name",
      assistantNameAria: "Assistant name",
      apiNameLegend: "API name",
      apiNameAria: "API name",
      taglineLegend: "Tagline",
      taglineAria: "Tagline",
      logoPathLegend: "Logo path or URL",
      logoPathAria: "Logo path or URL",
      faviconPathLegend: "Favicon path or URL",
      faviconPathAria: "Favicon path or URL",
      assetPathPlaceholder: "/branding/logo.svg",
      assetPathHint: "Use a public asset path or absolute URL that the client can load directly.",
      defaultTitleLegend: "Default SEO title",
      defaultTitleAria: "Default SEO title",
      defaultDescriptionLegend: "Default SEO description",
      defaultDescriptionAria: "Default SEO description",
      fontStylesheetLegend: "Font stylesheet URL",
      fontStylesheetAria: "Font stylesheet URL",
      fontStylesheetPlaceholder: "https://fonts.googleapis.com/css2?...",
      fontStylesheetHint:
        "Load the hosted stylesheet for your chosen typefaces before applying the font-family stacks below.",
      displayFontLegend: "Display font-family",
      displayFontAria: "Display font-family",
      bodyFontLegend: "Body font-family",
      bodyFontAria: "Body font-family",
      monoFontLegend: "Mono font-family",
      monoFontAria: "Mono font-family",
      lightThemeLegend: "Light theme JSON",
      lightThemeAria: "Light theme JSON",
      darkThemeLegend: "Dark theme JSON",
      darkThemeAria: "Dark theme JSON",
      themeJsonHint:
        "Provide a full daisyUI token object. Keys must match the brand theme contract exactly.",
      contentOverridesLegend: "Content overrides JSON",
      contentOverridesAria: "Content overrides JSON",
      contentOverridesHint:
        "Use dot-delimited locale keys such as `dashboard.pageTitle` to override any user-facing copy.",
      saveAria: "Save brand control plane settings",
      saveButton: "Save Brand Settings",
      tabs: {
        identity: "Identity",
        identityDescription:
          "Adjust naming, assistant voice, and logo assets for the active brand package.",
        typography: "Typography",
        typographyDescription:
          "Set the hosted font stylesheet and the display, body, and mono stacks used across the interface.",
        themes: "Theme tokens",
        themesDescription:
          "Edit the light and dark daisyUI token objects that define semantic color, radius, border, and depth values.",
        content: "Content",
        contentDescription:
          "Tune default SEO copy and runtime locale overrides without touching the source catalog.",
      },
      stats: {
        product: "Product",
        productDescription: "Primary customer-facing application name.",
        assistant: "Assistant",
        assistantDescription: "Default assistant persona shown across chat surfaces.",
        locales: "Locales",
        localesDescription: "Supported interface languages exposed in settings.",
        overrides: "Overrides",
        overridesDescription: "Custom copy keys merged into the active locale catalog.",
      },
      errors: {
        invalidLightTheme: "Light theme JSON is invalid.",
        invalidDarkTheme: "Dark theme JSON is invalid.",
        invalidContentOverrides: "Content overrides JSON is invalid.",
        failedToSave: "Failed to save brand settings",
      },
    },
  },
} as const;

export default settingsbrand;
