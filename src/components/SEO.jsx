import { useEffect } from 'react';

const DEFAULT_TITLE = 'OurMangaSite - Lee Manga, Manhwa y Manhua Online';
const DEFAULT_DESCRIPTION = 'OurMangaSite - Lee tus mangas, manhwas y manhuas favoritos en línea en español. Catálogo actualizado con los últimos capítulos, noticias y comunidad.';
const DEFAULT_IMAGE = '/android-chrome-512x512.png';

/**
 * Actualiza o crea una etiqueta <meta> en el <head>
 */
function upsertMeta(attrName, attrValue, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Actualiza o crea <link rel="canonical">
 */
function upsertCanonical(url) {
  if (!url) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/**
 * Componente SEO dinámico para páginas React SPA (compatible con React 19 sin dependencias externas).
 * Gestiona título, meta description, Open Graph, Twitter Cards, canonical, robots y JSON-LD.
 */
const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  canonicalPath,
  noindex = false,
  schema = null
}) => {
  useEffect(() => {
    const fullTitle = title
      ? (title.includes('OurMangaSite') ? title : `${title} | OurMangaSite`)
      : DEFAULT_TITLE;

    const cleanDescription = String(description || DEFAULT_DESCRIPTION)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const currentUrl = typeof window !== 'undefined'
      ? (canonicalPath ? `${origin}${canonicalPath}` : window.location.href.split('?')[0])
      : '';

    const resolvedImage = image && image.startsWith('http')
      ? image
      : `${origin}${image || DEFAULT_IMAGE}`;

    // 1. Título y meta básicos
    document.title = fullTitle;
    upsertMeta('name', 'description', cleanDescription);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 2. Canonical URL
    if (currentUrl) {
      upsertCanonical(currentUrl);
    }

    // 3. Open Graph (Facebook, Discord, WhatsApp, Telegram)
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', cleanDescription);
    upsertMeta('property', 'og:image', resolvedImage);
    if (currentUrl) upsertMeta('property', 'og:url', currentUrl);

    // 4. Twitter / X Cards
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', cleanDescription);
    upsertMeta('name', 'twitter:image', resolvedImage);

    // 5. Datos Estructurados JSON-LD (Rich Snippets de Google)
    const scriptId = 'seo-json-ld';
    let jsonLdScript = document.getElementById(scriptId);

    if (schema) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = scriptId;
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(schema);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [title, description, image, type, canonicalPath, noindex, schema]);

  return null;
};

export default SEO;
