import { expect, it } from "vitest";
import { formatDateWithLocale, resolvePreferredLocale } from "./locale-format";

it("resolves the active locale before the fallback locale", () => {
  expect(resolvePreferredLocale("ko-KR", "en-US")).toBe("ko-KR");
  expect(resolvePreferredLocale("", ["en-US"])).toBe("en-US");
});

it("returns null for invalid dates", () => {
  expect(
    formatDateWithLocale("not-a-date", "en-US", "en-US", {
      dateStyle: "medium",
    }),
  ).toBeNull();
});

it("formats combined date and time with a deterministic separator", () => {
  const value = new Date("2026-03-31T13:10:00.000Z");
  const result = formatDateWithLocale(value, "en-US", "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  expect(result).toBe(
    `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(value)} ${new Intl.DateTimeFormat("en-US", { timeStyle: "short", timeZone: "UTC" }).format(value)}`,
  );
});

it("splits explicit date and time fields into deterministic browser-safe output", () => {
  const value = new Date("2026-03-31T13:10:00.000Z");
  const result = formatDateWithLocale(value, "en-US", "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  expect(result).toBe(
    `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(value)} ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(value)}`,
  );
});
