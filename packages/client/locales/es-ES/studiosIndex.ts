const studiosIndex = {
  studiosIndex: {
    seoTitle: "Directorio de Estudios",
    seoDescription:
      "Explora perfiles de estudios, filtra atributos operativos y lanza práctica de entrevistas desde contexto de estudio.",
    title: "Directorio de Estudios",
    subtitle:
      "Explora perfiles de estudios, filtra por atributos operativos y pasa directamente a la práctica de entrevistas.",
    errorTitle: "Directorio de estudios no disponible",
    retryAria: "Reintentar carga de estudios",
    retryButton: "Reintentar",
    emptyTitle: "Ningún estudio coincide con estos filtros",
    emptyDescription:
      "Ajusta la búsqueda actual o la combinación de filtros para mostrar otro perfil de estudio.",
    stats: {
      totalTitle: "Total de Estudios",
      totalDesc: "Perfiles actualmente indexados",
      filteredTitle: "Resultados Filtrados",
      filteredDesc: "Coinciden con tus filtros actuales",
      remoteTitle: "Remoto Amigable",
      remoteDesc: "Estudios marcados como remoto amigable",
    },
    filters: {
      searchLegend: "Buscar estudios",
      searchPlaceholder: "Buscar por nombre, descripción o ubicación",
      searchAria: "Buscar estudios",
      typeLegend: "Tipo de estudio",
      typeAria: "Filtrar estudios por tipo",
      sizeLegend: "Tamaño del estudio",
      sizeAria: "Filtrar estudios por tamaño",
      allTypesOption: "Todos los tipos",
      allSizesOption: "Todos los tamaños",
      remoteLabel: "Solo remoto amigable",
      remoteAria: "Mostrar solo estudios remoto amigables",
      clearButton: "Limpiar filtros",
      clearAria: "Limpiar búsqueda y filtros de estudios",
    },
    options: {
      type: {
        mobile: "Móvil",
        platform: "Plataforma",
        publisher: "Editora",
        services: "Servicios",
        aiTech: "IA/Tecnología",
        midSize: "Mediano",
        unknown: "Desconocido",
      },
      size: {
        range50To199: "50-199 empleados",
        range200To999: "200-999 empleados",
        range500Plus: "500+ empleados",
        range1000Plus: "1000+ empleados",
        notAvailable: "No disponible",
      },
    },
    list: {
      loadMoreButton: "Cargar más estudios",
      loadMoreAria: "Cargar más resultados de estudios",
    },
    card: {
      unknownType: "Tipo desconocido",
      unknownSize: "Tamaño desconocido",
      unknownLocation: "Ubicación desconocida",
      noDescription: "Sin descripción del estudio disponible.",
      previewButton: "Vista Previa",
      previewAria: "Vista previa del perfil del estudio {studio}",
      viewButton: "Ver Detalles",
      viewAria: "Ver detalles del estudio {studio}",
    },
    preview: {
      closeButtonAria: "Cerrar vista previa del estudio",
      closeButton: "Cerrar",
      closeBackdropButton: "Cerrar",
      remoteYes: "Sí",
      startInterviewButton: "Iniciar Entrevista",
      startInterviewAria: "Iniciar práctica de entrevista para {studio}",
      openDetailButton: "Abrir Perfil Completo",
      openDetailAria: "Abrir perfil completo del estudio {studio}",
      missingTitle: "Estudio No Disponible",
      missingDescription:
        "Esta vista previa del estudio ya no está disponible en los resultados. Actualiza o elige otro estudio.",
      stats: {
        interviewReadyTitle: "Listo para Entrevista",
        interviewReadyValue: "Activado",
        interviewReadyDesc: "Usa este estudio como contexto de entrevista",
        locationTitle: "Ubicación",
        locationDesc: "Región operativa principal",
        remoteTitle: "Trabajo Remoto",
        remoteDesc: "Estado de política remota",
      },
    },
    errors: {
      loadFailed: "Error al cargar estudios",
    },
  },
} as const;

export default studiosIndex;
