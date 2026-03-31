import { isValidEmail } from "@bao/shared/utils/validation";
import type { SmtpConnection } from "./email-delivery-connection";
import type {
  DeliveryEnvelopeMetadata,
  EmailDeliveryRequest,
  EmailDeliveryResult,
  EmailTransportRuntimeConfig,
  SmtpResponse,
} from "./email-delivery-contracts";
import {
  buildRfc822Message,
  createMessageId,
  resolveEhloHost,
  smtpSupportsAuthMode,
  smtpSupportsCapability,
} from "./email-delivery-message";

export const createDeliveryEnvelopeMetadata = (
  config: EmailTransportRuntimeConfig,
): DeliveryEnvelopeMetadata => {
  const clientHost = resolveEhloHost(config.fromEmail, config.host);
  return {
    clientHost,
    deliveredAt: new Date().toISOString(),
    messageId: createMessageId(clientHost),
  };
};

export const validateTransport = (
  config: EmailTransportRuntimeConfig,
  recipientEmail: string,
): void => {
  if (config.host.trim().length === 0) {
    throw new Error("Email delivery host is not configured");
  }

  if (!isValidEmail(config.fromEmail)) {
    throw new Error("Email delivery sender address is invalid");
  }

  if (!isValidEmail(recipientEmail)) {
    throw new Error("Email delivery recipient address is invalid");
  }

  if (config.username.trim().length > 0 && !config.password) {
    throw new Error("Email delivery password is required for authenticated SMTP");
  }
};

export const performSmtpDelivery = async (
  connection: SmtpConnection,
  config: EmailTransportRuntimeConfig,
  request: EmailDeliveryRequest,
  metadata: DeliveryEnvelopeMetadata,
): Promise<EmailDeliveryResult> => {
  const initialCapabilities = await connection.ehlo(metadata.clientHost);
  const securedCapabilities =
    config.security === "starttls"
      ? await performStartTls(connection, initialCapabilities, metadata.clientHost)
      : initialCapabilities;

  await authenticateIfNeeded(connection, config, securedCapabilities);
  await connection.sendMail(
    config.fromEmail,
    request.recipientEmail,
    buildRfc822Message(config, request, metadata.deliveredAt, metadata.messageId),
  );

  return {
    recipientEmail: request.recipientEmail,
    fromEmail: config.fromEmail,
    deliveredAt: metadata.deliveredAt,
    messageId: metadata.messageId,
  };
};

const performStartTls = async (
  connection: SmtpConnection,
  capabilities: SmtpResponse,
  clientHost: string,
): Promise<SmtpResponse> => {
  if (!smtpSupportsCapability(capabilities, "STARTTLS")) {
    throw new Error("SMTP server does not support STARTTLS");
  }

  await connection.startTls();
  return connection.ehlo(clientHost);
};

const authenticateIfNeeded = async (
  connection: SmtpConnection,
  config: EmailTransportRuntimeConfig,
  capabilities: SmtpResponse,
): Promise<void> => {
  const username = config.username.trim();
  if (username.length === 0) {
    return;
  }

  const password = config.password ?? "";
  if (!smtpSupportsAuthMode(capabilities, config.authMethod)) {
    throw new Error(`SMTP server does not advertise AUTH ${config.authMethod.toUpperCase()}`);
  }

  if (config.authMethod === "login") {
    await connection.authLogin(username, password);
    return;
  }

  await connection.authPlain(username, password);
};
