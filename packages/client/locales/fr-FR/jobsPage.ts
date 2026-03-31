const catalog = {
  jobsPage: {
    seoTitle: "Offres d'emploi",
    seoDescription:
      "Recherchez et filtrez les postes jeu vidéo par plateforme, type de studio, genre et niveau d'expérience.",
    title: "Offres d'emploi",
    emptyStateTitle: "Aucune offre ne correspond à vos filtres",
    emptyStateDescription:
      "Ajustez votre recherche ou vos filtres pour élargir la vue actuelle de découverte d'offres.",
    pagination: {
      navigationAria: "Pagination des offres",
      previousAria: "Page précédente des offres",
      nextAria: "Page suivante des offres",
      pageAria: "Aller à la page d'offres {page}",
      summary: "Affichage de {start} à {end} sur {total} offres",
    },
    options: {
      all: "Tous",
      allTypes: "Tous les types",
      allPlatforms: "Toutes les plateformes",
      allGenres: "Tous les genres",
      experience: {
        entry: "Débutant",
        mid: "Intermédiaire",
        director: "Directeur",
      },
      studioType: {
        indie: "Indépendant",
        platform: "Plateforme",
        esports: "Esport",
        unknown: "Inconnu",
      },
      genre: {
        strategy: "Stratégie",
        sports: "Sport",
        racing: "Course",
        platformer: "Jeu de plateforme",
        horror: "Horreur",
        adventure: "Aventure",
        fighting: "Combat",
        survival: "Survie",
        cardGame: "Jeu de cartes",
        indie: "Indépendant",
      },
    },
    bootstrapError: "Impossible de charger les offres.",
    bootstrapRetry: "Réessayer",
    bootstrapRetryAria: "Réessayer le chargement des offres",
  },
} as const;

export default catalog;
