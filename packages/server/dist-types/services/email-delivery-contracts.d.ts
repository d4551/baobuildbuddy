import type { EmailTransportSettings } from "@bao/shared/types/settings-contracts";
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
export declare class SmtpProtocolError extends Error {
    readonly code: number;
    readonly lines: string[];
    constructor(code: number, lines: string[], context: string);
}
export declare class SmtpConnectionClosedError extends Error {
}
