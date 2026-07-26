const settings = {
  settings: {
    seoTitle: "Paramètres et profil",
    seoDescription:
      "Gérez votre profil, les fournisseurs IA, les préférences de notifications et les valeurs d'automatisation.",
    title: "Paramètres et profil",
    subtitle:
      "Centralisez votre identité, le comportement de l'assistant et les paramètres d'automatisation.",
    bootstrapError: "Impossible de charger les paramètres ou le profil.",
    bootstrapRetry: "Réessayer",
    bootstrapRetryAria: "Réessayer le chargement des paramètres",
    profile: {
      title: "Profil utilisateur",
      subtitle:
        "Gardez votre identité professionnelle à jour pour les CV, lettres et candidatures.",
      nameLegend: "Nom",
      emailLegend: "E-mail",
      currentRoleLegend: "Poste actuel",
      currentCompanyLegend: "Entreprise actuelle",
      locationLegend: "Localisation",
      yearsExperienceLegend: "Années d'expérience",
      githubLegend: "Profil GitHub",
      linkedinLegend: "Profil LinkedIn",
      summaryLegend: "Résumé",
      technicalSkillsLegend: "Compétences techniques (séparées par des virgules)",
      softSkillsLegend: "Compétences relationnelles (séparées par des virgules)",
      saveButton: "Enregistrer le profil",
    },
    preferences: {
      title: "Préférences",
      subtitle: "Ajustez le thème, la langue et les notifications pour votre espace de travail.",
      themeLabel: "Thème",
      lightTheme: "Clair",
      darkTheme: "Sombre",
      languageLegend: "Langue",
      notificationsLegend: "Préférences de notification",
      saveButton: "Enregistrer les préférences",
    },
    automation: {
      title: "Automatisation",
      subtitle: "Configurez le comportement des scripts RPA et le navigateur par défaut.",
      headlessTitle: "Mode sans tête",
      headlessDescription: "Exécuter le navigateur sans interface graphique visible.",
      smartSelectorsTitle: "Sélecteurs intelligents",
      smartSelectorsDescription: "Utiliser l'IA pour détecter les champs de formulaire.",
      autoScreenshotsTitle: "Captures d'écran automatiques",
      autoScreenshotsDescription: "Sauvegarder les captures d'écran à chaque étape.",
      timeoutLegend: "Délai d'attente (secondes)",
      retentionLegend: "Rétention des captures (jours)",
      concurrentRunsLegend: "Exécutions simultanées max",
      defaultBrowserLegend: "Navigateur par défaut",
      saveButton: "Enregistrer l'automatisation",
    },
    aiProviders: {
      title: "Fournisseurs IA",
      subtitle:
        "Gardez les fournisseurs locaux en priorité et les fournisseurs cloud en repli contrôlé.",
      configuredBadge: "Configuré",
      endpointLabel: "URL de l'endpoint",
      credentialLabel: "Clé API",
      testButton: "Tester",
      localModelLegend: "Nom du modèle local",
      connectedBadge: "Connecté",
      failedBadge: "Échoué",
      saveButton: "Enregistrer les clés API",
      connectionSuccessful: "Connexion réussie",
      connectionFailed: "Connexion échouée",
      preferredProviderLegend: "Fournisseur IA préféré",
      preferredProviderAria: "Sélectionner le fournisseur IA préféré",
      preferredProviderSaveButton: "Enregistrer le chat par défaut",
      preferredProviderHint:
        "Ce contrôle rapide définit le fournisseur par défaut pour le chat et les conversations.",
      preferredProviderSaved: "Fournisseur préféré mis à jour",
      routingTitle: "Routage par usage",
      routingSubtitle:
        "Attribuez un fournisseur et un modèle optionnel à chaque capacité IA afin que le chat, l'entretien, l'export et l'automatisation n'utilisent pas un unique défaut global.",
      saveRoutingAria: "Enregistrer le routage IA par usage",
      saveRoutingButton: "Enregistrer le routage",
      routingSaved: "Routage IA enregistré",
      purposeProviderLegend: "Fournisseur",
      purposeProviderAria: "Sélectionner le fournisseur pour {purpose}",
      purposeModelLegend: "Modèle spécifique",
      purposeModelAria: "Définir le modèle spécifique pour {purpose}",
      purposeModelPlaceholder:
        "Laissez vide pour utiliser le modèle par défaut ou l'auto-détection",
      purposeModelHint:
        "N'indiquez un modèle précis que si ce flux en a réellement besoin. Sinon, le défaut du fournisseur reste actif.",
      purposes: {
        chat: {
          label: "Conversation",
          description: "Chat général, réponses de l'assistant et conversations interactives.",
        },
        interviewQuestions: {
          label: "Questions d'entretien",
          description:
            "Génération des questions, relances et rythme conversationnel de l'entretien.",
        },
        interviewFeedback: {
          label: "Retour d'entretien",
          description:
            "Notation des réponses, feedback par grille et synthèses finales d'entretien.",
        },
        resume: {
          label: "CV",
          description: "Synthèse du CV, amélioration, scoring et sorties structurées du parcours.",
        },
        coverLetter: {
          label: "Lettre de motivation",
          description: "Rédaction, révision et formulation prête à exporter de la lettre.",
        },
        emailResponse: {
          label: "Réponse email",
          description: "Brouillons de réponse aux recruteurs et génération d'emails automatiques.",
        },
        jobMatch: {
          label: "Compatibilité poste",
          description: "Score d'adéquation, analyse du poste et synthèses de recommandation.",
        },
        scrapeEnrichment: {
          label: "Enrichissement de scraping",
          description:
            "Enrichissement des personas studio et analyse des signaux de recrutement après scraping.",
        },
        automationFieldMapping: {
          label: "Mappage d'automatisation",
          description:
            "Mappage des champs, inférence des sélecteurs et automatisation structurée des formulaires.",
        },
      },
      ollamaTipTitle: "Astuce : Ollama s'installe en dehors de l'app",
      ollamaTipDescription:
        "Installez-le d'abord puis suivez la configuration officielle d'Ollama pour votre machine ou votre projet sur",
      ollamaTipLinkAria: "Ouvrir le site Ollama dans un nouvel onglet",
    },
    brand: {
      title: "Plan de contrôle de marque",
      subtitle:
        "Identité white-label, typographie, jetons de thème sémantiques et contenu localisé depuis une configuration persistée unique.",
      infoTitle: "Un contrat pour chaque surface de marque",
      infoDescription:
        "Prévisualisez l'identité, la typographie, les jetons de thème et le contenu localisé avant de publier les changements dans tout le produit.",
      previewEyebrow: "Aperçu en direct",
      previewTitle: "Aperçu de la surface de marque",
      previewSubtitle:
        "Validez le logo, le ton, le contraste des jetons et les remplacements de contenu avant d'enregistrer la prochaine variante.",
      previewLogoAlt: "Aperçu du logo {brand}",
      previewPrimaryAction: "Ouvrir l'espace de travail",
      previewSecondaryAction: "Relire le contenu",
      editorTabsAria: "Sections de l'éditeur de marque",
      assetPathHint:
        "Utilisez un chemin d'actif public ou une URL absolue que le client peut charger directement.",
      fontStylesheetHint:
        "Chargez la feuille de style hébergée de vos polices avant d'appliquer les piles `font-family` ci-dessous.",
      tabs: {
        identity: "Identité",
        identityDescription:
          "Ajustez les noms, la voix de l'assistant et les ressources de logo pour le package de marque actif.",
        typography: "Typographie",
        typographyDescription:
          "Définissez la feuille de style hébergée et les piles display, body et mono utilisées dans toute l'interface.",
        themes: "Jetons de thème",
        themesDescription:
          "Modifiez les objets de jetons daisyUI clair et sombre qui définissent les couleurs sémantiques, rayons, bordures et profondeurs.",
        content: "Contenu",
        contentDescription:
          "Ajustez le contenu SEO par défaut et les remplacements de locale à l'exécution sans toucher au catalogue source.",
      },
      stats: {
        product: "Produit",
        productDescription: "Nom principal de l'application visible par les clients.",
        assistant: "Copilote",
        assistantDescription:
          "Personnalité d'assistant affichée par défaut dans les surfaces de chat.",
        locales: "Langues",
        localesDescription: "Langues d'interface prises en charge et exposées dans les paramètres.",
        overrides: "Surcharges",
        overridesDescription: "Clés de contenu personnalisées fusionnées dans le catalogue actif.",
      },
    },
    toasts: {
      apiKeysSaved: "Clés API enregistrées",
      themeSaved: "Thème enregistré",
      preferencesSaved: "Préférences enregistrées",
      profileSaved: "Profil enregistré",
      automationSaved: "Paramètres d'automatisation enregistrés",
    },
  },
} as const;

export default settings;
