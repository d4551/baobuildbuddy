import type { SmtpConnectionState } from "./email-delivery-connection-state";
import { type EmailTransportRuntimeConfig } from "./email-delivery-contracts";
export declare const connectSmtpSocket: (state: SmtpConnectionState, config: EmailTransportRuntimeConfig) => Promise<void>;
export declare const upgradeSmtpSocket: (state: SmtpConnectionState, _config: EmailTransportRuntimeConfig, socket: Bun.Socket<undefined>) => Promise<Bun.Socket<undefined>>;
export declare const writeBytes: (state: SmtpConnectionState, socket: Bun.Socket<undefined>, bytes: Uint8Array, offset: number) => Promise<void>;
