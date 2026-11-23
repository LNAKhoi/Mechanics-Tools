import { useEffect } from 'react';

type SeoInput = { title: string; description: string; canonical?: string; jsonLd?: object | object[] };

const siteName = "LEE's tools";
const descriptionFor = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 160);
const upsert = (selector: string, create: () => HTMLElement) => {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) { element = create(); document.head.append(element); }
  return element;
};

/** Keeps browser-rendered public-page metadata in sync with the current route. */
export function useSeo({ title, description, canonical, jsonLd }: SeoInput) {
  useEffect(() => {
    document.title = `${title} | ${siteName}`;
    const meta = upsert('meta[name="description"]', () => { const value = document.createElement('meta'); value.name = 'description'; return value; }) as HTMLMetaElement;
    meta.content = descriptionFor(description);
    const link = upsert('link[rel="canonical"]', () => { const value = document.createElement('link'); value.rel = 'canonical'; return value; }) as HTMLLinkElement;
    link.href = new URL(canonical ?? window.location.pathname, window.location.origin).toString();
    const script = document.head.querySelector<HTMLScriptElement>('script[data-seo-json-ld]');
    if (jsonLd) {
      const value = script ?? document.createElement('script');
      value.type = 'application/ld+json'; value.dataset.seoJsonLd = 'true'; value.textContent = JSON.stringify(jsonLd);
      if (!script) document.head.append(value);
    } else script?.remove();
  }, [title, description, canonical, jsonLd]);
}
