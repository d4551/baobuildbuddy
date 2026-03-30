import type { EmailTransportSettings } from "@bao/shared";

export type SmtpAuthMode = EmailTransportSettings["authMethod"];

/**
 * Runtime transport config with the secret SMTP password attached.
 */
export interface EmailTransportRuntimeConfig extends EmailTransportSettings {
  password?: string | null;
}

/**
 * Outbound email delivery request payload.
 */
export interface EmailDeliveryRequest {
  recipientEmail: string;
  subject: string;
  body: string;
}

/**
 * Email delivery success metadata returned to automation flows.
 */
export interface EmailDeliveryResult {
  recipientEmail: string;
  fromEmail: string;
  deliveredAt: string;
  messageId: string;
}

export interface SmtpResponse {
  code: number;
  lines: string[];
}

export interface DeliveryEnvelopeMetadata {
  clientHost: string;
  deliveredAt: string;
  messageId: string;
}

export class SmtpProtocolError extends Error {
  constructor(
    public readonly code: number,
    public readonly lines: string[],
    context: string,
  ) {
    super(`${context}: ${lines.join(" ")}`.trim());
  }
}

export class SmtpConnectionClosedError extends Error {}
