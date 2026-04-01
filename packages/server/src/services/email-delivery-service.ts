import { settle } from "@bao/shared/utils/promise";
import { createServerLogger } from "../utils/logger";
import { SmtpConnection } from "./email-delivery-connection";
export type {
  EmailDeliveryRequest,
  EmailDeliveryResult,
  EmailTransportRuntimeConfig,
} from "./email-delivery-contracts";
import type {
  EmailDeliveryRequest,
  EmailDeliveryResult,
  EmailTransportRuntimeConfig,
} from "./email-delivery-contracts";
import {
  createDeliveryEnvelopeMetadata,
  performSmtpDelivery,
  validateTransport,
} from "./email-delivery-operations";

/**
 * Bun-native SMTP delivery service used by automation email workflows.
 */
export class EmailDeliveryService {
  private readonly logger = createServerLogger("email-delivery");

  /**
   * Sends a generated reply over SMTP using the configured transport settings.
   *
   * @param config - Persisted SMTP transport config with the secret password.
   * @param request - Generated outbound message to deliver.
   * @returns Delivery metadata for audit trails and UI state.
   */
  async send(
    config: EmailTransportRuntimeConfig,
    request: EmailDeliveryRequest,
  ): Promise<EmailDeliveryResult> {
    validateTransport(config, request.recipientEmail);

    const metadata = createDeliveryEnvelopeMetadata(config);
    const connection = new SmtpConnection(config);

    const connectResult = await settle(connection.connect());
    if (connectResult.status === "rejected") {
      connection.close();
      throw connectResult.reason;
    }

    const deliveryResult = await settle(performSmtpDelivery(connection, config, request, metadata));
    const quitResult = await settle(connection.quit());
    if (quitResult.status === "rejected") {
      this.logger.warn("smtp quit failed", quitResult.reason);
    }
    connection.close();

    if (deliveryResult.status === "rejected") {
      throw deliveryResult.reason;
    }

    this.logger.info("email delivered", {
      recipientEmail: request.recipientEmail,
      fromEmail: config.fromEmail,
      messageId: metadata.messageId,
    });

    return deliveryResult.value;
  }
}

export const emailDeliveryService = new EmailDeliveryService();
