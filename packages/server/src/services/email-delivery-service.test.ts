import { afterEach, describe, expect, test } from "bun:test";
import type { EmailTransportSecurityOption } from "@bao/shared/constants/settings";
import { createSmtpHarness, type SmtpHarnessHandle } from "../test-support/email/smtp-harness";
import { emailDeliveryService } from "./email-delivery-service";

const SMTP_LINE_BREAK = "\r\n" as const;
const SMTP_USERNAME = "mailer@example.test";
const SMTP_PASSWORD = "secret-password";
const SMTP_FROM_NAME = "Bao Build Buddy";
const activeHarnesses: SmtpHarnessHandle[] = [];

const encodeBase64Utf8 = (value: string): string => Buffer.from(value, "utf8").toString("base64");

const createTransportConfig = (
  port: number,
  authMethod: "plain" | "login",
  security: EmailTransportSecurityOption = "plain",
) => ({
  host: "127.0.0.1",
  port,
  security,
  username: SMTP_USERNAME,
  fromEmail: SMTP_USERNAME,
  fromName: SMTP_FROM_NAME,
  authMethod,
  connectionTimeoutSeconds: 10,
  password: SMTP_PASSWORD,
});

const encodePlainAuthCommand = () =>
  `AUTH PLAIN ${encodeBase64Utf8(`\u0000${SMTP_USERNAME}\u0000${SMTP_PASSWORD}`)}`;

const encodeMessageBody = (body: string) =>
  encodeBase64Utf8(body.replaceAll("\n", SMTP_LINE_BREAK));

afterEach(() => {
  for (const harness of activeHarnesses.splice(0)) {
    harness.stop();
  }
});

const expectRejectedDelivery = async (deliveryPromise: Promise<unknown>): Promise<Error> => {
  const result = await deliveryPromise.then(
    () => null,
    (error: unknown) => error,
  );
  expect(result).toBeInstanceOf(Error);
  return result as Error;
};

const registerAuthPlainTest = (): void => {
  test("sends a message using AUTH PLAIN", async () => {
    const harness = createSmtpHarness();
    activeHarnesses.push(harness);
    const body = "Thanks for the interview.\nLooking forward to next steps.";
    const result = await emailDeliveryService.send(createTransportConfig(harness.port, "plain"), {
      recipientEmail: "recruiter@example.test",
      subject: "Interview follow-up",
      body,
    });

    expect(result.recipientEmail).toBe("recruiter@example.test");
    expect(harness.exchange.commands).toContain(encodePlainAuthCommand());
    expect(harness.exchange.message).toContain(`From: ${SMTP_FROM_NAME} <${SMTP_USERNAME}>`);
    expect(harness.exchange.message).toContain("To: <recruiter@example.test>");
    expect(harness.exchange.message).toContain("Subject: Interview follow-up");
    expect(harness.exchange.message).toContain("Content-Transfer-Encoding: base64");
    expect(harness.exchange.message).toContain(encodeMessageBody(body));
  });
};

const registerAuthLoginTest = (): void => {
  test("sends a message using AUTH LOGIN", async () => {
    const harness = createSmtpHarness();
    activeHarnesses.push(harness);
    const result = await emailDeliveryService.send(createTransportConfig(harness.port, "login"), {
      recipientEmail: "producer@example.test",
      subject: "Thanks",
      body: "Appreciate the update.",
    });

    expect(result.recipientEmail).toBe("producer@example.test");
    expect(harness.exchange.commands).toContain("AUTH LOGIN");
    expect(harness.exchange.commands).toContain(encodeBase64Utf8(SMTP_USERNAME));
    expect(harness.exchange.username).toBe(SMTP_USERNAME);
    expect(harness.exchange.message).toContain("To: <producer@example.test>");
  });
};

const registerStartTlsFailureTest = (): void => {
  test("fails when STARTTLS is required but missing", async () => {
    const harness = createSmtpHarness({
      capabilityLines: ["smtp.test", "AUTH PLAIN LOGIN"],
    });
    activeHarnesses.push(harness);
    const error = await expectRejectedDelivery(
      emailDeliveryService.send(createTransportConfig(harness.port, "plain", "starttls"), {
        recipientEmail: "starttls@example.test",
        subject: "TLS required",
        body: "Secure message.",
      }),
    );
    expect(error.message).toContain("SMTP server does not support STARTTLS");
  });
};

const registerAuthMismatchFailureTest = (): void => {
  test("fails when requested auth method is not advertised", async () => {
    const harness = createSmtpHarness({
      capabilityLines: ["smtp.test", "STARTTLS", "AUTH PLAIN"],
    });
    activeHarnesses.push(harness);
    const error = await expectRejectedDelivery(
      emailDeliveryService.send(createTransportConfig(harness.port, "login", "plain"), {
        recipientEmail: "login@example.test",
        subject: "Auth mismatch",
        body: "Testing login fallback.",
      }),
    );
    expect(error.message).toContain("SMTP server does not advertise AUTH LOGIN");
  });
};

const registerDisconnectFailureTest = (): void => {
  test("fails when the SMTP connection closes before message delivery completes", async () => {
    const harness = createSmtpHarness({
      closeOnCommand: "MAIL FROM:<mailer@example.test>",
    });
    activeHarnesses.push(harness);
    const error = await expectRejectedDelivery(
      emailDeliveryService.send(createTransportConfig(harness.port, "plain", "plain"), {
        recipientEmail: "disconnect@example.test",
        subject: "Connection closed",
        body: "Testing unexpected disconnect.",
      }),
    );
    expect(error.message).toContain("SMTP connection closed");
    expect(harness.exchange.commands).toContain("MAIL FROM:<mailer@example.test>");
  });
};

describe("email delivery service", () => {
  registerAuthPlainTest();
  registerAuthLoginTest();
  registerStartTlsFailureTest();
  registerAuthMismatchFailureTest();
  registerDisconnectFailureTest();
});
