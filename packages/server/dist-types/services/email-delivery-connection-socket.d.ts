import { type EmailTransportRuntimeConfig } from "./email-delivery-contracts";
import type { SmtpConnectionState } from "./email-delivery-connection-state";
export declare const connectSmtpSocket: (state: SmtpConnectionState, config: EmailTransportRuntimeConfig) => Promise<void>;
export declare const upgradeSmtpSocket: (state: SmtpConnectionState, config: EmailTransportRuntimeConfig, socket: Bun.Socket<undefined>) => Promise<Bun.Socket<undefined>>;
export declare const writeBytes: (state: SmtpConnectionState, socket: Bun.Socket<undefined>, bytes: Uint8Array, offset: number) => Promise<void>;
