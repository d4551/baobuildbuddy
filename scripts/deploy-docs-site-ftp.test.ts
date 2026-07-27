import { describe, expect, test } from "bun:test";
import { readFtpDeployConfig } from "./deploy-docs-site-ftp";

const CREDENTIALS = {
  BAO_DOCS_FTP_HOST: "ftp.example.test",
  BAO_DOCS_FTP_USER: "site.owner",
  BAO_DOCS_FTP_PASSWORD: "s3cret",
} as const;

const DEFAULT_PORT = 21;
const CUSTOM_PORT = 2121;
const DEFAULT_TIMEOUT_MS = 30_000;

describe("readFtpDeployConfig fail-closed behaviour", () => {
  test("names every missing credential at once instead of one per run", () => {
    const result = readFtpDeployConfig({});
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.missing).toEqual([
      "BAO_DOCS_FTP_HOST",
      "BAO_DOCS_FTP_USER",
      "BAO_DOCS_FTP_PASSWORD",
    ]);
  });

  test("treats a blank credential as missing rather than logging in anonymously", () => {
    const result = readFtpDeployConfig({ ...CREDENTIALS, BAO_DOCS_FTP_PASSWORD: "   " });
    expect(result.ok === false && result.missing).toEqual(["BAO_DOCS_FTP_PASSWORD"]);
  });
});

describe("readFtpDeployConfig defaults", () => {
  test("defaults to explicit FTPS on the standard port at the server root", () => {
    const result = readFtpDeployConfig(CREDENTIALS);
    expect(result.ok && result.config).toEqual({
      host: CREDENTIALS.BAO_DOCS_FTP_HOST,
      user: CREDENTIALS.BAO_DOCS_FTP_USER,
      password: CREDENTIALS.BAO_DOCS_FTP_PASSWORD,
      port: DEFAULT_PORT,
      remoteRoot: "/",
      secure: true,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
  });

  test("only an explicit false disables TLS", () => {
    expect(readFtpDeployConfig({ ...CREDENTIALS, BAO_DOCS_FTP_SECURE: "FALSE" })).toMatchObject({
      config: { secure: false },
    });
    expect(readFtpDeployConfig({ ...CREDENTIALS, BAO_DOCS_FTP_SECURE: "no" })).toMatchObject({
      config: { secure: true },
    });
  });

  test("honours port and remote-root overrides", () => {
    const result = readFtpDeployConfig({
      ...CREDENTIALS,
      BAO_DOCS_FTP_PORT: String(CUSTOM_PORT),
      BAO_DOCS_FTP_REMOTE_ROOT: "/public_html",
    });
    expect(result).toMatchObject({ config: { port: CUSTOM_PORT, remoteRoot: "/public_html" } });
  });

  test("falls back to the default port when the override is not a positive integer", () => {
    expect(readFtpDeployConfig({ ...CREDENTIALS, BAO_DOCS_FTP_PORT: "not-a-port" })).toMatchObject({
      config: { port: DEFAULT_PORT },
    });
  });
});
