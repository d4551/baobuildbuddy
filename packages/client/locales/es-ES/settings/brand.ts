const catalog = {
  settings: {
    brand: {
      title: "Plano de control de marca",
      subtitle:
        "Identidad white-label, tipografía, tokens semánticos de tema y copy localizado desde una sola configuración persistida.",
      infoTitle: "Un solo contrato para cada superficie de marca",
      infoDescription:
        "Previsualiza identidad, tipografía, tokens de tema y copy localizado antes de publicar cambios en todo el producto.",
      previewEyebrow: "Vista previa en vivo",
      previewTitle: "Vista previa de la marca",
      previewSubtitle:
        "Valida logo, tono, contraste de tokens y overrides de copy antes de guardar la siguiente variante.",
      previewLogoAlt: "Vista previa del logo de {brand}",
      previewPrimaryAction: "Abrir espacio de trabajo",
      previewSecondaryAction: "Revisar copy",
      editorTabsAria: "Secciones del editor de marca",
      nameLegend: "Nombre del producto",
      nameAria: "Nombre del producto",
      assistantNameLegend: "Nombre del asistente",
      assistantNameAria: "Nombre del asistente",
      apiNameLegend: "Nombre de la API",
      apiNameAria: "Nombre de la API",
      taglineLegend: "Eslogan",
      taglineAria: "Eslogan",
      logoPathLegend: "Ruta o URL del logo",
      logoPathAria: "Ruta o URL del logo",
      faviconPathLegend: "Ruta o URL del favicon",
      faviconPathAria: "Ruta o URL del favicon",
      assetPathHint:
        "Usa una ruta de recurso pública o una URL absoluta que el cliente pueda cargar directamente.",
      defaultTitleLegend: "Título SEO por defecto",
      defaultTitleAria: "Título SEO por defecto",
      defaultDescriptionLegend: "Descripción SEO por defecto",
      defaultDescriptionAria: "Descripción SEO por defecto",
      fontStylesheetLegend: "URL de la hoja de estilos de fuentes",
      fontStylesheetAria: "URL de la hoja de estilos de fuentes",
      fontStylesheetHint:
        "Carga la hoja de estilos alojada de tus tipografías antes de aplicar las pilas de font-family de abajo.",
      displayFontLegend: "font-family de display",
      displayFontAria: "font-family de display",
      bodyFontLegend: "font-family del cuerpo",
      bodyFontAria: "font-family del cuerpo",
      monoFontLegend: "font-family mono",
      monoFontAria: "font-family mono",
      lightThemeLegend: "JSON del tema claro",
      lightThemeAria: "JSON del tema claro",
      darkThemeLegend: "JSON del tema oscuro",
      darkThemeAria: "JSON del tema oscuro",
      themeJsonHint:
        "Proporciona un objeto completo de tokens daisyUI. Las claves deben coincidir exactamente con el contrato de tema de marca.",
      contentOverridesLegend: "JSON de overrides de contenido",
      contentOverridesAria: "JSON de overrides de contenido",
      contentOverridesHint:
        "Usa claves de locale con puntos como `dashboard.pageTitle` para sobrescribir cualquier copy visible para usuarios.",
      saveAria: "Guardar configuración del plano de control de marca",
      saveButton: "Guardar marca",
      tabs: {
        identity: "Identidad",
        identityDescription:
          "Ajusta nombres, voz del asistente y recursos del logo para el paquete de marca activo.",
        typography: "Tipografía",
        typographyDescription:
          "Define la hoja de estilos alojada y las pilas display, body y mono usadas en toda la interfaz.",
        themes: "Tokens de tema",
        themesDescription:
          "Edita los objetos de tokens daisyUI claros y oscuros que definen color semántico, radio, borde y profundidad.",
        content: "Contenido",
        contentDescription:
          "Ajusta el copy SEO por defecto y los overrides de locale en tiempo de ejecución sin tocar el catálogo fuente.",
      },
      stats: {
        product: "Producto",
        productDescription: "Nombre principal de la aplicación visible para clientes.",
        assistant: "Asistente",
        assistantDescription:
          "Persona del asistente mostrada por defecto en las superficies de chat.",
        locales: "Idiomas",
        localesDescription: "Idiomas de interfaz compatibles expuestos en configuración.",
        overridesDescription: "Claves de copy personalizadas mezcladas en el catálogo activo.",
      },
      errors: {
        invalidLightTheme: "El JSON del tema claro no es válido.",
        invalidDarkTheme: "El JSON del tema oscuro no es válido.",
        invalidContentOverrides: "El JSON de overrides de contenido no es válido.",
        failedToSave: "No se pudo guardar la configuración de marca",
      },
    },
  },
} as const;

export default catalog;
