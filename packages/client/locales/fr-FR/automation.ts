const automation = {
  automation: {
    hub: {
      pageTitle: "Centre d'automatisation",
      title: "Automatisation",
      audit: {
        title: "Audit des capacités RPA",
        description:
          "Vérifie quels flux d'automatisation navigateur sont implémentés, configurés et observables.",
        aria: "Audit des capacités RPA",
        openScraperButton: "Ouvrir le centre de scraping",
        openScraperAria: "Ouvrir le centre de scraping avec les cibles RPA étendues",
        loadErrorFallback: "Impossible de charger l'audit des capacités RPA.",
        available: "Disponible",
        needsConfig: "Configuration requise",
        unavailable: "Indisponible",
        type: {
          jobApply: "Flux de candidature",
          scrape: "Flux de scraping",
        },
        capabilities: {
          jobApply: "Candidature",
        },
        issueSummaryAria:
          "Ouvrir les problèmes de configuration pour {capability}. {count} problème nécessite une attention.",
        issues: {
          providerSettingsUnavailable:
            "Les paramètres du fournisseur d'offres sont actuellement indisponibles.",
          portalConfigurationMissing:
            "Ajoutez une configuration de portail gaming pour {portalId}.",
          portalDisabled: "Activez {portalName} dans les paramètres du fournisseur d'offres.",
          portalFallbackUrlMissing: "Ajoutez une URL de secours pour {portalName}.",
        },
        actions: {
          fixSetup: "Corriger la config",
          fixSetupAria: "Ouvrir les paramètres pour corriger les problèmes de scraping",
          openJobApply: "Ouvrir la candidature",
          openJobApplyAria: "Ouvrir le flux d'automatisation de candidature",
          openScraper: "Ouvrir le scraper",
          openScraperAria: "Ouvrir le flux d'automatisation du scraper",
        },
        coverage: {
          manual: "Exécution manuelle prise en charge",
          scheduled: "Exécution planifiée prise en charge",
          history: "Historique des exécutions suivi",
          live: "Mises à jour en direct disponibles",
        },
        summary: {
          total: "Capacités",
          totalDesc: "Flux RPA implémentés",
          configured: "Configurées",
          configuredDesc: "Prêtes dans l'environnement actuel",
          live: "Événements en direct",
          liveDesc: "Émettent des mises à jour d'exécution",
        },
      },
    },
    runs: {
      title: "Exécutions d'automatisation",
      openButton: "Ouvrir",
      liveBadge: "En direct",
      liveBadgeAria: "État d'exécution en direct",
      columns: {
        progress: "Progression",
        updated: "Mis à jour",
        actions: "Commandes",
      },
    },
    jobApply: {
      title: "Automatisation des candidatures",
      stream: {
        title: "Flux d'exécution en direct",
        subtitle: "Suivez la progression pendant l'exécution de l'automatisation.",
        aria: "Résumé de l'état d'exécution en direct",
        runIdTitle: "ID d'exécution",
        statusTitle: "Statut",
        stateLabel: "État actuel du flux",
        progressTitle: "Progression",
        progressAria: "Progression de l'exécution automatisée",
        currentStepLabel: "Étape {current} sur {total}",
        retryButton: "Relancer le flux",
        retryAria: "Relancer le flux d'exécution",
        cancelButton: "Arrêter le flux",
        cancelAria: "Arrêter l'abonnement au flux",
        errorTitle: "Erreur du flux",
        startErrorFallback: "Impossible de démarrer le flux en direct pour cette exécution.",
        states: {
          idle: "Inactif",
          loading: "Connexion au flux",
          success: "Terminé",
          empty: "Aucune exécution sélectionnée",
          errorRetryable: "Problème temporaire du flux",
          errorNonRetryable: "Flux indisponible",
          unauthorized: "Non autorisé",
        },
        steps: {
          queued: "En file d'attente",
          running: "En cours",
          completed: "Terminé",
        },
        eventType: {
          progress: "Progression",
          result: "Résultat",
          error: "Erreur",
        },
        eventMessages: {
          resultSuccess: "Exécution terminée avec succès.",
          resultError: "Exécution terminée avec une erreur.",
          protocolError: "Le runner a signalé une erreur de protocole.",
        },
        eventsAria: "Chronologie des événements d'exécution",
        eventsTitle: "Événements récents",
        events: {
          empty: "Aucun événement pour le moment.",
          columns: {
            timestamp: "Horodatage",
            stage: "Étape",
            status: "Statut",
            message: "Détail",
          },
        },
      },
    },
    email: {
      title: "Automatisation des réponses e-mail",
    },
    runDetail: {
      screenshotLinkLabel: "Ouvrir la capture {index}",
      screenshotLoadError: "La capture {index} n'a pas pu être affichée.",
      retryButton: "Réessayer",
      retryAria: "Réessayer le chargement des détails d'exécution",
      progressSummary: "{percent}% terminé",
      progressAria: "Progression de l'exécution automatisée",
      states: {
        idle: "Inactif",
        loading: "Chargement des détails d'exécution",
        success: "Exécution chargée",
        empty: "Exécution introuvable",
        errorRetryable: "Erreur temporaire de chargement",
        errorNonRetryable: "Impossible de charger les détails de l'exécution",
        unauthorized: "Non autorisé",
      },
      timeline: {
        aria: "Chronologie d'exécution",
        title: "Chronologie de l'exécution",
        empty: "Aucun événement de chronologie disponible.",
        stageProgress: "Mise à jour de progression",
        stageResult: "Résultat de l'exécution",
        stageError: "Erreur du runner",
        stageOutputStep: "Étape de sortie",
        stageRunStatus: "État de l'exécution",
        resultSuccess: "Exécution terminée avec succès.",
        resultError: "Exécution terminée avec une erreur.",
        columns: {
          time: "Heure",
          stage: "Étape",
          status: "Statut",
          message: "Détail",
        },
      },
    },
    scraper: {
      title: "Centre des opérations de scraping",
      stats: {
        enrichedJobsTitle: "Postes enrichis par IA",
        enrichedJobsDescription: "Lignes avec contexte studio et signaux de recrutement",
      },
      table: {
        actionsLabel: "Opérations",
        personaSummaryLabel: "Persona :",
      },
      errors: {
        rewardFailed: "Impossible d'attribuer la progression du scraping.",
      },
    },
  },
} as const;

export default automation;
