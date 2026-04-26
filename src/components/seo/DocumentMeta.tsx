import { useEffect } from "react";

type DocumentMetaProps = {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  ogImage?: string;
};

type ManagedNode = {
  element: HTMLMetaElement | HTMLLinkElement;
  previousValue: string | null;
  wasCreated: boolean;
  property: "content" | "href";
};

function ensureMetaTag(selector: string, attributes: Record<string, string>) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    return { element: existing, wasCreated: false };
  }

  const element = document.createElement("meta");
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  document.head.appendChild(element);
  return { element, wasCreated: true };
}

function ensureLinkTag(selector: string, attributes: Record<string, string>) {
  const existing = document.head.querySelector<HTMLLinkElement>(selector);
  if (existing) {
    return { element: existing, wasCreated: false };
  }

  const element = document.createElement("link");
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  document.head.appendChild(element);
  return { element, wasCreated: true };
}

export function DocumentMeta({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogUrl,
  ogImage,
}: DocumentMetaProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const managedNodes: ManagedNode[] = [];

    const manageMeta = (
      selector: string,
      attributes: Record<string, string>,
      nextValue: string | undefined,
    ) => {
      if (!nextValue) return;
      const { element, wasCreated } = ensureMetaTag(selector, attributes);
      managedNodes.push({
        element,
        previousValue: element.getAttribute("content"),
        wasCreated,
        property: "content",
      });
      element.setAttribute("content", nextValue);
    };

    const manageLink = (
      selector: string,
      attributes: Record<string, string>,
      nextValue: string | undefined,
    ) => {
      if (!nextValue) return;
      const { element, wasCreated } = ensureLinkTag(selector, attributes);
      managedNodes.push({
        element,
        previousValue: element.getAttribute("href"),
        wasCreated,
        property: "href",
      });
      element.setAttribute("href", nextValue);
    };

    document.title = title;

    manageMeta('meta[name="description"]', { name: "description" }, description);
    manageMeta('meta[property="og:title"]', { property: "og:title" }, ogTitle ?? title);
    manageMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      ogDescription ?? description,
    );
    manageMeta('meta[property="og:type"]', { property: "og:type" }, ogType);
    manageMeta('meta[property="og:url"]', { property: "og:url" }, ogUrl);
    manageMeta('meta[property="og:image"]', { property: "og:image" }, ogImage);
    manageLink('link[rel="canonical"]', { rel: "canonical" }, canonical);

    return () => {
      document.title = previousTitle;

      managedNodes.reverse().forEach(({ element, previousValue, wasCreated, property }) => {
        if (wasCreated) {
          element.remove();
          return;
        }

        if (previousValue === null) {
          element.removeAttribute(property);
          return;
        }

        element.setAttribute(property, previousValue);
      });
    };
  }, [canonical, description, ogDescription, ogImage, ogTitle, ogType, ogUrl, title]);

  return null;
}
