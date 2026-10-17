import { describe, expect, it } from "vitest";
import { AD_LP_SLUGS } from "../routes/routeManifest";
import { canonicalPath, canonicalizeEvent, safeDimension, validateEnvelope, validateEvent } from "../../shared/analytics-contract";
import { validAnalyticsEnvelope } from "../../shared/analytics-fixtures";

describe("analytics V1 trust boundary", () => {
  it("accepts the shared fixture and separates envelope from per-event rejection", () => {
    const batch = structuredClone(validAnalyticsEnvelope);
    expect(validateEnvelope(batch)).toBe(true);
    expect(validateEvent(batch.events[0])).toBe(true);
    batch.events[0].props = { phone: "private" };
    expect(validateEnvelope(batch)).toBe(true);
    expect(validateEvent(batch.events[0])).toBe(false);
  });

  it("rejects duplicate IDs in one transport envelope", () => {
    const batch = structuredClone(validAnalyticsEnvelope);
    batch.events.push(structuredClone(batch.events[0]));
    expect(validateEnvelope(batch)).toBe(false);
  });

  it("rejects impossible calendar times and coerced primitive values", () => {
    const event = structuredClone(validAnalyticsEnvelope.events[0]);
    event.occurred_at = "2026-02-30T00:00:00.000Z";
    expect(validateEvent(event)).toBe(false);
    event.occurred_at = "2026-02-28T00:00:00Z";
    expect(validateEvent(event)).toBe(true);
    expect(validateEvent({ ...event, props: { ...event.props, navigation_reason: ["initial"] } })).toBe(false);
  });

  it("covers the actual public route registry and canonical static entries", () => {
    for (const slug of AD_LP_SLUGS.filter(slug => slug !== "sem-erro")) {
      for (const suffix of ["", "/", ".html", "/index.html"]) {
        expect(canonicalPath(`/${slug}${suffix}`)).toBe(`/${slug}`);
      }
    }
    expect(canonicalPath("/index.html")).toBe("/");
    expect(canonicalPath("/loja-fisica/index.html")).toBe("/loja-fisica/");
    for (const path of ["/admin/marketing/", "/unknown", "/?phone=private", "/aniversario#private"]) {
      expect(canonicalPath(path)).toBeNull();
    }
  });

  it("rejects personal data and unknown props while allowing a generic WhatsApp CTA", () => {
    const event = structuredClone(validAnalyticsEnvelope.events[0]);
    event.event_type = "whatsapp_click";
    event.props = { cta_id: "hero", cta_location: "home" };
    expect(validateEvent(event)).toBe(true);
    for (const input of ["person@example.com", "+5562996503403", "5562996503403", "https://example.com", "my message"]) {
      expect(safeDimension(input)).toBe(false);
    }
    event.attribution = { referrer_host: "person@example.com" };
    expect(validateEvent(event)).toBe(false);
    delete event.attribution;
    event.props.message = "private";
    expect(validateEvent(event)).toBe(false);
  });

  it("compares duplicate payloads independently of object key order", () => {
    const event = validAnalyticsEnvelope.events[0];
    const reordered = { ...event, props: { scrollable: true, storage_mode: "session", navigation_reason: "initial" } };
    expect(canonicalizeEvent(event)).toBe(canonicalizeEvent(reordered));
  });
});
