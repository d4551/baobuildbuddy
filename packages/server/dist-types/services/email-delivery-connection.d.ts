import { type EmailTransportRuntimeConfig, type SmtpResponse } from "./email-delivery-contracts";
export declare class SmtpConnection {
    private readonly config;
    private readonly state;
    constructor(config: EmailTransportRuntimeConfig);
    connect(): Promise<void>;
    ehlo(clientHost: string): Promise<SmtpResponse>;
    startTls(): Promise<void>;
    authPlain(username: string, password: string): Promise<void>;
    authLogin(username: string, password: string): Promise<void>;
    sendMail(fromEmail: string, recipientEmail: string, message: string): Promise<void>;
    quit(): Promise<void>;
    close(): void;
    private command;
    private writeCommand;
}
