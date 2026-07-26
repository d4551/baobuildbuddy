const apiDocs = {
  apiDocs: {
    seoTitle: "Documentation API",
    seoDescription:
      "Explorez les endpoints disponibles et testez les requêtes directement depuis l'application.",
    title: "Référence API",
    intro:
      "Consultez la surface de votre API et exécutez des vérifications d'endpoint dans le testeur intégré.",
    endpointNavigator: "Navigation des endpoints",
    groups: {
      untagged: "Non étiqueté",
    },
    state: {
      loading: "Chargement de la spécification API",
      errorRetryable: "Le service est temporairement indisponible. Réessayez.",
      errorNonRetryable: "Impossible de charger la documentation API.",
      unauthorized: "Vous n'êtes pas autorisé à consulter la documentation API.",
      empty: "Aucun endpoint API n'a été trouvé.",
    },
    actions: {
      retry: "Réessayer",
    },
    a11y: {
      endpointNavigation: "Navigation des endpoints",
    },
    endpoint: {
      noDescription: "Aucune description fournie.",
      methodLabel: "Méthode",
      operationIdLabel: "ID d'opération",
      openTester: "Ouvrir le testeur",
      navigateAria: "Naviguer vers {method} {path}",
      openTesterAria: "Ouvrir le testeur pour {method} {path}",
    },
    tester: {
      title: "Testeur d'endpoint",
      lifecycleTitle: "Cycle de vie de la requête",
      pathParametersIntro: "Paramètres de chemin",
      queryParametersIntro: "Paramètres de requête",
      requestBodyIntro: "Corps de la requête",
      requestBodyAria: "Charge JSON du corps de la requête",
      bodyPlaceholder: '{\n  "exemple": "valeur"\n}',
      noRequestBodyTemplate: "Aucun modèle de corps n'a été fourni par la spécification OpenAPI.",
      parameterLabel: "Paramètre {name}",
      send: "Envoyer la requête",
      close: "Fermer",
      closeAria: "Fermer le testeur d'endpoint",
      responseTitle: "Réponse",
      responseStatusLabel: "Statut {status} : {text}",
      durationLabel: "Durée {duration} ms",
      errorFallback: "La requête a échoué sans erreur détaillée.",
      invalidPath: "Tous les paramètres de chemin sont requis.",
      requestFailure: "Impossible d'exécuter la requête.",
      requestErrorToast: "La requête a échoué",
      emptyResponseToast: "La requête s'est terminée sans corps de réponse",
      requestSuccessToast: "Requête exécutée avec succès",
      emptyResponse: "La réponse ne contient aucun corps.",
      requestMethodLabel: "Méthode",
      requestUrlLabel: "Adresse URL",
      steps: {
        configure: "Configurer",
        send: "Envoyer",
        response: "Vérifier la réponse",
      },
      metadataTitle: "Métadonnées de la réponse",
      metadata: {
        columns: {
          label: "Libellé",
          value: "Valeur",
        },
        responseStatus: "Statut",
        duration: "Durée",
      },
      responseHeadersLabel: "En-têtes de réponse",
      noResponseHeaders: "Aucun en-tête de réponse.",
    },
  },
} as const;

export default apiDocs;
