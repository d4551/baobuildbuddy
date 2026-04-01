const catalog = {
  portfolioPage: {
    title: "Créateur de portfolio",
    bootstrap: {
      loadError: "Impossible de charger les données du portfolio.",
      retryButton: "Réessayer",
      retryAria: "Réessayer le chargement des données du portfolio",
    },
    emptyState: {
      title: "Votre portfolio est prêt à être construit",
      description:
        "Commencez par les informations de votre profil, puis ajoutez un ou plusieurs projets pour façonner la vue publique du portfolio.",
      profileButton: "Modifier le profil",
    },
    preview: {
      pageTitle: "Aperçu du portfolio",
      description:
        "Vérifiez la présentation publiée de votre portfolio avant de l'exporter ou de la partager.",
      backButton: "Retour à l'éditeur",
      backButtonAria: "Retour à l'éditeur de portfolio",
      exportPdfButton: "Exporter en PDF",
      exportPdfAria: "Exporter l'aperçu du portfolio en PDF",
      retryButton: "Réessayer",
      retryAria: "Réessayer le chargement de l'aperçu du portfolio",
      loadError: "Impossible de charger l'aperçu du portfolio.",
      defaultTitle: "Mon Portfolio",
      contactButton: "Me contacter",
      contactAria: "Contacter le propriétaire du portfolio par e-mail",
      websiteButton: "Visiter le site",
      websiteAria: "Ouvrir le site du portfolio",
      featuredProjectsTitle: "Projets mis en avant",
      moreProjectsTitle: "Plus de projets",
      viewButton: "Voir",
      emptyStateTitle: "Aucun projet à afficher",
      emptyStateDescription:
        "Ajoutez des projets dans l'éditeur de portfolio pour alimenter cet aperçu avec vos travaux.",
      notFoundTitle: "Portfolio introuvable",
      notFoundDescription: "Créez d'abord votre portfolio puis revenez sur cet aperçu.",
    },
  },
} as const;

export default catalog;
