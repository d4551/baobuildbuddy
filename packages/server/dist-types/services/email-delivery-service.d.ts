import type { EmailTransportSettings } from "@bao/shared";
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
/**
 * Bun-native SMTP delivery service used by automation email workflows.
 */
export declare class EmailDeliveryService {
    private readonly logger;
    /**
     * Sends a generated reply over SMTP using the configured transport settings.
     *
     * @param config - Persisted SMTP transport config with the secret password.
     * @param request - Generated outbound message to deliver.
     * @returns Delivery metadata for audit trails and UI state.
     */
    send(config: EmailTransportRuntimeConfig, request: EmailDeliveryRequest): Promise<EmailDeliveryResult>;
    /**
     * Executes the SMTP handshake, optional auth, and message transfer sequence.
     */
    private performDelivery;
    /**
     * Validates SMTP settings before opening a network connection.
     */
    private validateTransport;
    /**
     * Upgrades the connection with STARTTLS when configured.
     */
    private performStartTls;
    /**
     * Authenticates against the SMTP server when credentials are configured.
     */
    private authenticateIfNeeded;
}
export declare const emailDeliveryService: EmailDeliveryService;
