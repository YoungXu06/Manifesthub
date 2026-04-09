/**
 * SeoHead — injects locale-aware <head> meta via react-helmet-async.
 * Usage: <SeoHead titleKey="seo.homeTitle" descKey="seo.homeDesc" />
 * Falls back to props `title` / `description` for custom text.
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { getLangMeta, SUPPORTED_LANGUAGES } from '../../i18n';

const BASE_URL = 'https://manifesthub.app';

const SeoHead = ({
  title,
  description,
  path = '',
  noIndex = false,
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const meta = getLangMeta(lang);

  const pageTitle = title
    ? `${title} | Manifest Hub`
    : 'Manifest Hub – Visualize Your Dreams, Manifest Your Reality';
  const pageDesc = description ||
    'A modern Law of Attraction platform for goal visualization, daily check-ins, and gratitude journaling.';
  const canonical = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <html lang={meta.htmlLang} dir={meta.dir} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title"       content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:type"        content="website" />
      <meta property="og:locale"      content={meta.htmlLang.replace('-', '_')} />
      <meta property="og:image"       content={`${BASE_URL}/manifest-hub-logo.jpg`} />
      <meta property="og:site_name"   content="Manifest Hub" />

      {/* Twitter */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image"       content={`${BASE_URL}/manifest-hub-logo.jpg`} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* hreflang alternate links */}
      {SUPPORTED_LANGUAGES.map(l => (
        <link
          key={l.code}
          rel="alternate"
          hrefLang={l.htmlLang}
          href={`${BASE_URL}${path}?lang=${l.code}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${path}`} />
    </Helmet>
  );
};

export default SeoHead;
