const catalog = {
  aiChatPage: {
    title: "Discuter avec {brand}",
    seoTitle: "{brand} Chat IA",
    seoDescription:
      "Discutez avec votre copilote IA de carrière pour la stratégie CV, la préparation aux entretiens et l'automatisation.",
    subtitle: "Votre assistant IA de carrière pour l'industrie du jeu",
    clearAria: "Effacer la conversation du chat",
    clearButton: "Effacer",
    logAria: "Conversation de chat IA",
    youLabel: "Vous",
    inputPlaceholder:
      "Demandez à {assistant} quelque chose sur votre carrière dans l'industrie du jeu",
    inputAria: "Message du chat",
    sendAria: "Envoyer le message du chat",
    voiceSettings: {
      legend: "Profils de modèles de voix",
      sttProviderLabel: "Fournisseur de conversion voix-texte",
      sttProviderAria: "Sélection du fournisseur de conversion voix-texte",
      sttModelLabel: "Modèle de conversion voix-texte",
      sttModelAria: "Sélection du modèle de conversion voix-texte",
      ttsProviderLabel: "Fournisseur de synthèse vocale",
      ttsProviderAria: "Sélection du fournisseur de synthèse vocale",
      ttsModelLabel: "Modèle de synthèse vocale",
      ttsModelAria: "Sélection du modèle de synthèse vocale",
      hint: "Ces profils fournisseur/modèle sont sauvegardés pour les flux vocaux du chat et de l'automatisation.",
      saveButton: "Sauvegarder le profil de voix",
      saveAria: "Enregistrer les préférences de fournisseur et de modèle de voix",
      saveSuccess: "Profil de voix sauvegardé",
      saveErrorFallback: "Échec de l'enregistrement du profil de voix",
      unsavedHint: "Vous avez des modifications de profil de voix non enregistrées.",
      providers: {
        browser: "Navigateur",
        custom: "Personnalisé",
      },
    },
  },
} as const;

export default catalog;
