const catalog = {
  settings: {
    emailDelivery: {
      title: "Entrega de correo",
      subtitle:
        "Configura el transporte SMTP saliente que se usa cuando la automatización envía una respuesta generada.",
      configuredBadge: "Listo",
      incompleteBadge: "Necesita configuración",
      hostLegend: "Host SMTP",
      hostAria: "Host del servidor SMTP",
      portLegend: "Puerto",
      portAria: "Puerto del servidor SMTP",
      timeoutLegend: "Tiempo de conexión (segundos)",
      timeoutAria: "Tiempo de conexión SMTP en segundos",
      securityLegend: "Seguridad",
      securityAria: "Modo de seguridad del transporte SMTP",
      securityOptions: {
        tls: "TLS implícito",
        plain: "TCP simple",
      },
      authLegend: "Autenticación",
      authAria: "Modo de autenticación SMTP",
      usernameLegend: "Usuario",
      usernameAria: "Usuario SMTP",
      fromNameLegend: "Nombre del remitente",
      fromNameAria: "Nombre visible del remitente",
      fromEmailLegend: "Correo del remitente",
      fromEmailAria: "Correo del remitente saliente",
      fromEmailHint: "Esta dirección se usa en la cabecera From del mensaje.",
      passwordLegend: "Contraseña",
      passwordPlaceholder: "Guardar o reemplazar la contraseña SMTP",
      passwordAria: "Contraseña SMTP",
      passwordHint: "Guarda una contraseña si este transporte requiere envío autenticado.",
      passwordStoredHint:
        "Ya hay una contraseña guardada. Guardar un nuevo valor la reemplazará, o puedes borrarla abajo.",
      clearPasswordAria: "Borrar contraseña guardada para entrega de correo",
      clearPasswordButton: "Borrar contraseña",
      savePasswordAria: "Guardar contraseña para entrega de correo",
      savePasswordButton: "Guardar contraseña",
      saveAria: "Guardar configuración de entrega de correo",
      saveButton: "Guardar entrega de correo",
    },
  },
} as const;

export default catalog;
