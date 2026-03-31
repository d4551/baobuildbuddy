const catalog = {
  settings: {
    errors: {
      failedToTestProvider: "Error al probar proveedor",
      failedToSaveApiKeys: "Error al guardar claves API",
      failedToSaveEmailDelivery: "Error al guardar la configuración de entrega de correo",
      failedToSaveEmailDeliveryPassword: "Error al guardar la contraseña de entrega de correo",
      failedToSaveTheme: "Error al guardar tema",
      failedToSavePreferences: "Error al guardar preferencias",
      nameTooShort: "El nombre debe tener al menos 2 caracteres",
      invalidEmail: "Introduce una dirección de email válida",
      invalidEmailDeliverySender: "Introduce un remitente válido para entrega de correo",
      failedToSaveProfile: "Error al guardar perfil",
      failedToSaveAutomation: "Error al guardar configuración de automatización",
    },
  },
} as const;

export default catalog;
