export type { EmailDeliveryRequest, EmailDeliveryResult, EmailTransportRuntimeConfig, } from "./email-delivery-contracts";
import type { EmailDeliveryRequest, EmailDeliveryResult, EmailTransportRuntimeConfig } from "./email-delivery-contracts";
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
}
export declare const emailDeliveryService: EmailDeliveryService;
