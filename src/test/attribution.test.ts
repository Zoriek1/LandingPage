import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { captureUtmsFromUrl, getCampaign, getUtms } from "@/lib/attribution";

function setSearch(search: string) {
  window.history.replaceState({}, "", search || "/");
}

describe("attribution", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setSearch("/");
  });

  afterEach(() => {
    setSearch("/");
  });

  it("getUtms: a URL vence sobre o sessionStorage", () => {
    sessionStorage.setItem("utm_campaign", "antiga");
    setSearch("?utm_campaign=nova&utm_source=ig");

    const utms = getUtms();
    expect(utms.utm_campaign).toBe("nova");
    expect(utms.utm_source).toBe("ig");
  });

  it("getUtms: cai pro fallback de sessionStorage quando a URL perdeu a query", () => {
    sessionStorage.setItem("utm_campaign", "dia_das_maes");
    setSearch("/"); // SPA nav / reabertura sem querystring

    expect(getUtms().utm_campaign).toBe("dia_das_maes");
  });

  it("captureUtmsFromUrl: limpa chaves de campanha antiga (anti-Frankenstein)", () => {
    // Campanha antiga deixou content/term no storage.
    sessionStorage.setItem("utm_content", "banner_antigo");
    sessionStorage.setItem("utm_term", "rosas");

    // Nova URL traz só source + campaign.
    captureUtmsFromUrl("?utm_source=fb&utm_campaign=natal");

    expect(sessionStorage.getItem("utm_source")).toBe("fb");
    expect(sessionStorage.getItem("utm_campaign")).toBe("natal");
    // content/term da campanha antiga não podem vazar pra nova.
    expect(sessionStorage.getItem("utm_content")).toBeNull();
    expect(sessionStorage.getItem("utm_term")).toBeNull();
  });

  it("captureUtmsFromUrl: sem utm na URL, preserva o storage", () => {
    sessionStorage.setItem("utm_campaign", "preservar");
    captureUtmsFromUrl("?foo=bar");
    expect(sessionStorage.getItem("utm_campaign")).toBe("preservar");
  });

  it("getCampaign: URL-first com fallback de sessionStorage", () => {
    expect(getCampaign()).toBe("");

    sessionStorage.setItem("utm_campaign", "fallback_camp");
    expect(getCampaign()).toBe("fallback_camp");

    setSearch("?utm_campaign=url_camp");
    expect(getCampaign()).toBe("url_camp");
  });
});
