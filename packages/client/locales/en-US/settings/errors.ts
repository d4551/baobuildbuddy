const settingserrors = {
  settings: {
    errors: {
      failedToTestProvider: "Failed to test provider",
      failedToSaveApiKeys: "Failed to save API keys",
      failedToSaveEmailDelivery: "Failed to save email delivery settings",
      failedToSaveEmailDeliveryPassword: "Failed to save email delivery password",
      failedToSaveTheme: "Failed to save theme",
      failedToSavePreferences: "Failed to save preferences",
      nameTooShort: "Name must be at least 2 characters",
      invalidEmail: "Enter a valid email address",
      invalidEmailDeliverySender: "Enter a valid sender email for email delivery",
      failedToSaveProfile: "Failed to save profile",
      failedToSaveAutomation: "Failed to save automation settings",
    },
  },
} as const;

export default settingserrors;
