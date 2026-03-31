import { generateId } from "@bao/shared";
import type {
  EmailDeliveryRequest,
  EmailTransportRuntimeConfig,
  SmtpAuthMode,
  SmtpResponse,
} from "./email-delivery-contracts";

export const SMTP_LINE_BREAK = "\r\n";
const SMTP_BASE64_LINE_LENGTH = 76;
const SMTP_DEFAULT_EHLO_HOST = "localhost";
const SMTP_HEADER_NEWLINE_PATTERN = /\r?\n+/g;
const SMTP_ASCII_HEADER_PATTERN = /^[\x20-\x7E]*$/;
const SMTP_WHITESPACE_PATTERN = /\s+/g;

export const sanitizeHeaderValue = (value: string): string =>
  value.replace(SMTP_HEADER_NEWLINE_PATTERN, " ").replace(SMTP_WHITESPACE_PATTERN, " ").trim();

export const encodeBase64Utf8 = (value: string): string =>
  Buffer.from(value, "utf8").toString("base64");

const encodeHeaderValue = (value: string): string => {
  const sanitized = sanitizeHeaderValue(value);
  if (SMTP_ASCII_HEADER_PATTERN.test(sanitized)) {
    return sanitized;
  }
  return `=?UTF-8?B?${encodeBase64Utf8(sanitized)}?=`;
};

const formatAddress = (email: string, displayName: string): string => {
  const sanitizedName = sanitizeHeaderValue(displayName);
  if (sanitizedName.length === 0) {
    return `<${email}>`;
  }
  return `${encodeHeaderValue(sanitizedName)} <${email}>`;
};

const splitBase64Lines = (value: string): string[] => {
  const lines: string[] = [];
  for (let index = 0; index < value.length; index += SMTP_BASE64_LINE_LENGTH) {
    lines.push(value.slice(index, index + SMTP_BASE64_LINE_LENGTH));
  }
  return lines.length > 0 ? lines : [""];
};

export const dotStuffMessage = (value: string): string =>
  value
    .split(SMTP_LINE_BREAK)
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join(SMTP_LINE_BREAK);

export const resolveEhloHost = (fromEmail: string, fallbackHost: string): string => {
  const domain = fromEmail.split("@")[1]?.trim();
  if (domain && domain.length > 0) {
    return domain;
  }

  const sanitizedHost = fallbackHost.trim();
  return sanitizedHost.length > 0 ? sanitizedHost : SMTP_DEFAULT_EHLO_HOST;
};

export const createMessageId = (domain: string): string => `<${generateId()}@${domain}>`;

export const smtpSupportsCapability = (capabilities: SmtpResponse, capability: string): boolean => {
  const normalizedCapability = capability.toUpperCase();
  return capabilities.lines.some((line) => line.toUpperCase().startsWith(normalizedCapability));
};

export const smtpSupportsAuthMode = (
  capabilities: SmtpResponse,
  authMode: SmtpAuthMode,
): boolean => {
  const authLine = capabilities.lines.find((line) => line.toUpperCase().startsWith("AUTH "));
  if (!authLine) {
    return false;
  }

  const normalizedAuthLine = authLine.toUpperCase();
  if (authMode === "login") {
    return normalizedAuthLine.includes(" LOGIN");
  }

  return normalizedAuthLine.includes(" PLAIN");
};

export const buildRfc822Message = (
  config: EmailTransportRuntimeConfig,
  request: EmailDeliveryRequest,
  deliveredAt: string,
  messageId: string,
): string => {
  const encodedBody = splitBase64Lines(
    encodeBase64Utf8(request.body.replace(/\r?\n/g, SMTP_LINE_BREAK)),
  );
  const fromAddress = formatAddress(config.fromEmail, config.fromName);
  const toAddress = formatAddress(request.recipientEmail, "");

  return [
    `From: ${fromAddress}`,
    `To: ${toAddress}`,
    `Subject: ${encodeHeaderValue(request.subject)}`,
    `Date: ${new Date(deliveredAt).toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    ...encodedBody,
    "",
  ].join(SMTP_LINE_BREAK);
};
