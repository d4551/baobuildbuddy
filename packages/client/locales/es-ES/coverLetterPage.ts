const coverLetterPage = {
  coverLetterPage: {
  "title": "Cartas de Presentación",
  "subtitle": "Genera, busca y refina cartas de presentación por rol con un flujo consistente y plantillas reutilizables.",
  "generateButton": "Generar Carta de Presentación",
  "generateButtonAria": "Abrir diálogo de generación de carta",
  "notAvailable": "N/D",
  "emptyStateTitle": "Sin cartas aún",
  "emptyStateDescription": "Genera tu primera para empezar.",
  "filteredEmptyTitle": "Ninguna carta coincide con estos filtros",
  "filteredEmptyState": "Ninguna carta coincide con tus filtros activos.",
  "stats": {
    "totalTitle": "Total de Cartas",
    "totalDesc": "Guardadas en tu espacio",
    "filteredTitle": "Filtradas",
    "filteredDesc": "Coinciden con búsqueda y filtros actuales",
    "templatesTitle": "Tipos de Plantilla",
    "templatesDesc": "Plantillas distintas usadas"
  },
  "templates": {
    "professional": "Profesional",
    "creative": "Creativa",
    "gaming": "Juegos",
    "executive": "Ejecutiva",
    "technical": "Técnica"
  },
  "filters": {
    "searchLegend": "Buscar",
    "searchPlaceholder": "Buscar empresa, puesto o contenido",
    "searchAria": "Buscar cartas de presentación",
    "templateLegend": "Plantilla",
    "templateAria": "Filtrar por plantilla",
    "templateAll": "Todas las plantillas",
    "sortLegend": "Ordenar",
    "sortAria": "Ordenar cartas",
    "sortNewest": "Más recientes primero",
    "sortOldest": "Más antiguas primero",
    "clearButton": "Limpiar Filtros",
    "clearAria": "Limpiar filtros de cartas"
  },
  "pagination": {
    "navigationAria": "Paginación de cartas",
    "previousAria": "Página anterior de cartas",
    "nextAria": "Página siguiente de cartas",
    "pageAria": "Ir a la página de carta {page}",
    "summary": "Mostrando {start}-{end} de {total} cartas"
  },
  "cards": {
    "openAria": "Abrir carta para {position} en {company}",
    "emptyPreview": "Sin vista previa disponible aún.",
    "updatedAtLabel": "Actualizado",
    "editButton": "Editar",
    "editAria": "Editar carta para {position} en {company}",
    "deleteButton": "Eliminar",
    "deleteAria": "Eliminar carta para {position} en {company}"
  },
  "generate": {
    "title": "Generar Carta de Presentación",
    "subtitle": "Proporciona contexto del rol y genera un borrador para refinar.",
    "companyLegend": "Empresa",
    "companyPlaceholder": "ej. Riot Games",
    "companyAria": "Empresa objetivo",
    "companyHint": "El nombre de la empresa debe tener al menos {count} caracteres.",
    "positionLegend": "Puesto",
    "positionPlaceholder": "ej. Ingeniero de Gameplay Senior",
    "positionAria": "Puesto objetivo",
    "positionHint": "El puesto debe tener al menos {count} caracteres.",
    "resumeLegend": "Currículum (opcional)",
    "resumeAria": "Seleccionar contexto de currículum",
    "resumeNoneOption": "Sin currículum seleccionado",
    "jobDescriptionLegend": "Descripción del Puesto (opcional)",
    "jobDescriptionPlaceholder": "Pega una descripción del puesto para mejor personalización.",
    "jobDescriptionAria": "Contexto de descripción del puesto",
    "jobDescriptionHint": "Cuando se proporcione, incluir al menos {count} caracteres.",
    "templateLegend": "Plantilla",
    "templateAria": "Plantilla de carta",
    "cancelButton": "Cancelar",
    "cancelAria": "Cancelar generación de carta",
    "submitButton": "Generar",
    "submitAria": "Generar carta de presentación",
    "closeBackdropButton": "Cerrar",
    "closeBackdropAria": "Cerrar fondo del diálogo de generación"
  },
  "deleteDialog": {
    "title": "Eliminar Carta de Presentación",
    "message": "Esta carta se eliminará permanentemente.",
    "confirmButton": "Eliminar",
    "cancelButton": "Cancelar"
  },
  "toasts": {
    "deleted": "Carta eliminada",
    "deleteFailed": "Error al eliminar carta",
    "fetchFailed": "Error al obtener cartas de presentación",
    "companyMinLength": "El nombre de la empresa debe tener al menos {count} caracteres",
    "positionMinLength": "El puesto debe tener al menos {count} caracteres",
    "jobDescriptionMinLength": "La descripción del puesto debe tener al menos {count} caracteres cuando se proporcione",
    "generated": "Carta generada",
    "generatedWithoutRedirect": "Carta generada",
    "generateFailed": "Error al generar carta"
  }
},
} as const;

export default coverLetterPage;
