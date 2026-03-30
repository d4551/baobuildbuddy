import type { SmtpConnection } from "./email-delivery-connection";
import type { DeliveryEnvelopeMetadata, EmailDeliveryRequest, EmailDeliveryResult, EmailTransportRuntimeConfig } from "./email-delivery-contracts";
export declare const createDeliveryEnvelopeMetadata: (config: EmailTransportRuntimeConfig) => DeliveryEnvelopeMetadata;
export declare const validateTransport: (config: EmailTransportRuntimeConfig, recipientEmail: string) => void;
export declare const performSmtpDelivery: (connection: SmtpConnection, config: EmailTransportRuntimeConfig, request: EmailDeliveryRequest, metadata: DeliveryEnvelopeMetadata) => Promise<EmailDeliveryResult>;
