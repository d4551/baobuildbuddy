const studiosIndex = {
  studiosIndex: {
    seoTitle: "Répertoire des studios",
    seoDescription:
      "Parcourez les profils studio, filtrez les attributs opérationnels et lancez des entraînements d'entretien contextualisés.",
    title: "Répertoire des studios",
    subtitle:
      "Parcourez les profils studio, filtrez par attributs opérationnels et passez directement à l'entraînement d'entretien.",
    errorTitle: "Répertoire des studios indisponible",
    retryAria: "Réessayer le chargement des studios",
    retryButton: "Réessayer",
    emptyTitle: "Aucun studio ne correspond à ces filtres",
    emptyDescription:
      "Ajustez la recherche actuelle ou la combinaison de filtres pour afficher un autre profil studio.",
    options: {
      type: {
        indie: "Indépendant",
        platform: "Plateforme",
        esports: "Esport",
        general: "Généraliste",
        publisher: "Éditeur",
        aiTech: "IA/Tech",
        midSize: "Taille intermédiaire",
        unknown: "Inconnu",
      },
      size: {
        range50To199: "50 à 199 employés",
        range200To999: "200 à 999 employés",
        range500Plus: "500 employés et plus",
        range1000Plus: "1000 employés et plus",
        notAvailable: "Non disponible",
      },
    },
  },
} as const;

export default studiosIndex;
