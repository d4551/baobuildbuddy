import { type EmailTransportRuntimeConfig, type SmtpResponse } from "./email-delivery-contracts";
export declare class SmtpConnection {
    private readonly config;
    private readonly decoder;
    private readonly encoder;
    private readonly queuedResponses;
    private readonly pendingReaders;
    private readonly logger;
    private currentResponse;
    private buffer;
    private socket;
    private pendingDrain;
    private pendingTlsUpgrade;
    private closed;
    constructor(config: EmailTransportRuntimeConfig);
    /**
     * Opens the TCP connection and validates the SMTP greeting.
     */
    connect(): Promise<void>;
    /**
     * Sends EHLO and returns the server capability lines.
     */
    ehlo(clientHost: string): Promise<SmtpResponse>;
    /**
     * Negotiates STARTTLS and waits for the TLS handshake to complete.
     */
    startTls(): Promise<void>;
    /**
     * Authenticates with AUTH PLAIN.
     */
    authPlain(username: string, password: string): Promise<void>;
    /**
     * Authenticates with AUTH LOGIN.
     */
    authLogin(username: string, password: string): Promise<void>;
    /**
     * Delivers a single RFC 5322 message through the SMTP connection.
     */
    sendMail(fromEmail: string, recipientEmail: string, message: string): Promise<void>;
    /**
     * Sends QUIT if the socket is still open.
     */
    quit(): Promise<void>;
    /**
     * Closes the socket if it is still active.
     */
    close(): void;
    /**
     * Reads the next complete SMTP response from the server.
     */
    private readResponse;
    /**
     * Writes a command and validates the expected response code.
     */
    private command;
    /**
     * Writes bytes to the active socket while honoring backpressure.
     */
    private writeCommand;
    /**
     * Writes a buffer recursively until all queued bytes are sent.
     */
    private writeBytes;
    /**
     * Waits for a TLS handshake completion event after STARTTLS.
     */
    private waitForTlsUpgrade;
    /**
     * Parses SMTP response lines from socket data.
     */
    private handleData;
    /**
     * Accumulates multi-line SMTP responses and releases the next waiting reader.
     */
    private handleResponseLine;
    /**
     * Handles socket shutdown and rejects any pending readers.
     */
    private handleClose;
    /**
     * Resolves the pending TLS upgrade promise.
     */
    private handleHandshake;
    /**
     * Resolves the pending backpressure wait.
     */
    private resolvePendingDrain;
    /**
     * Rejects all pending promises when the socket errors or closes.
     */
    private rejectAllPending;
    /**
     * Validates the SMTP response code for a command context.
     */
    private assertExpectedCode;
    /**
     * Returns the active socket or throws when the connection is unavailable.
     */
    private assertSocket;
}
