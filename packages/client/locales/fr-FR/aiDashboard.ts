const aiDashboard = {
  aiDashboard: {
    title: "Tableau de bord IA",
    subtitle:
      "Gérez la disponibilité des fournisseurs, testez la connectivité et définissez votre modèle préféré depuis une surface de contrôle centralisée.",
    stats: {
      totalRequestsTitle: "Requêtes totales",
      totalRequestsDesc: "Messages envoyés via les services d'IA",
      successRateTitle: "Taux de réussite",
      successRateDesc: "Réponses de l'assistant par rapport aux invites utilisateur",
      averageResponseTitle: "Temps de réponse moyen",
      averageResponseDesc: "Latence mesurée sur les requêtes de chat",
      sessionsDesc: "Fournisseur actif : {provider}",
    },
    preference: {
      title: "Préférence de fournisseur",
      description:
        "Choisissez le fournisseur principal et le modèle par défaut pour le chat et la génération IA.",
      providerLegend: "Fournisseur",
      providerAria: "Fournisseur d'IA préféré",
      modelLegend: "Modèle",
      modelAria: "Modèle d'IA préféré",
      selectProviderOption: "Sélectionner un fournisseur",
      selectModelOption: "Sélectionner un modèle",
      providerNotConfiguredOption: "{provider} (Non configuré)",
      saveButton: "Enregistrer la préférence",
      saveAria: "Enregistrer le fournisseur et le modèle d'IA préférés",
      refreshButton: "Actualiser",
      refreshAria: "Actualiser les données du tableau de bord IA",
    },
    providerCard: {
      notConfiguredBadge: "Non configuré",
      testButton: "Tester la connexion",
      testAria: "Tester la connectivité de {provider}",
      configureButton: "Configurer",
      configureAria: "Ouvrir les paramètres pour configurer {provider}",
      testingLabel: "Test en cours...",
    },
    availability: {
      available: "Disponible",
      unavailable: "Indisponible",
    },
    health: {
      healthy: "Sain",
      degraded: "Dégradé",
      down: "Hors service",
      unconfigured: "Non configuré",
    },
    alerts: {
      noProvidersTitle: "Aucun fournisseur détecté",
      noProvidersDescription:
        "Configurez au moins un fournisseur d'IA dans Paramètres pour activer le chat et la génération.",
      testSuccessTitle: "Connectivité OK",
      testErrorTitle: "Échec de la connectivité",
    },
    tests: {
      localSuccess: "Le fournisseur d'IA local est accessible.",
      localFailure: "Le fournisseur d'IA local n'est pas accessible.",
      missingCredential: "Aucun identifiant n'est disponible pour ce fournisseur.",
      connectionSuccess: "Connexion réussie.",
      connectionFailure: "Échec de la connexion.",
    },
    errors: {
      usageLoadFailed: "Échec du chargement des métriques d'utilisation IA.",
      modelsLoadFailed: "Échec du chargement du catalogue de modèles IA.",
      preferenceSaveFailed: "Échec de l'enregistrement de la préférence IA.",
    },
    toasts: {
      loadFailed: "Échec du chargement des données du tableau de bord IA.",
      preferenceSaved: "Préférence IA enregistrée.",
      preferenceSaveFailed: "Échec de l'enregistrement de la préférence IA.",
    },
  },
} as const;

export default aiDashboard;
