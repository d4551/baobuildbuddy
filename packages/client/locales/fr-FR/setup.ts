const setup = {
  setup: {
    title: "Bienvenue sur {brand}",
    seoTitle: "Configuration {brand}",
    seoDescription:
      "Complétez votre profil, configurez les fournisseurs IA et lancez votre espace carrière.",
    auth: {
      setupTokenTitle: "Authentification sécurisée au premier démarrage",
      setupTokenDescription:
        "Saisissez le jeton d'installation opérateur pour créer la première clé API de cet espace.",
      setupTokenLegend: "Jeton d'installation",
      setupTokenPlaceholder: "Saisissez le jeton d'installation",
      setupTokenAria: "Jeton d'installation pour initialiser la première clé API",
      setupTokenRequiredError:
        "Saisissez le jeton d'installation pour initialiser la première clé API.",
      bootstrapUnavailableTitle: "Jeton d'installation indisponible",
      bootstrapUnavailableDescription:
        "Un opérateur doit définir BAO_AUTH_SETUP_TOKEN avant d'initialiser l'authentification sur cette installation.",
      apiKeyLegend: "Clé API existante",
      apiKeyPlaceholder: "Collez votre clé API existante",
      apiKeyAria: "Clé API existante pour cet espace",
      apiKeyRequiredError: "Collez la clé API existante pour terminer la configuration.",
    },
    successStatusAria: "État d'achèvement de la configuration",
    ollamaCommandCopyAria: "Copier la commande Ollama",
    ollamaCommandCopyTitle: "Copier la commande Ollama",
    ollamaCommandCopied: "Commande Ollama copiée",
    ollamaCommandCopyFailed: "Échec de la copie de la commande Ollama",
  },
} as const;

export default setup;
