import { company } from "@/src/config/company";
import { localePath, type Locale } from "@/src/lib/i18n/config";
import { getDictionary } from "@/src/lib/i18n";
import type { ProductDetail } from "@/src/lib/catalog/queries";

export function organizationJsonLd(locale: Locale, base: string) {
  const t = getDictionary(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: company.name,
        legalName: company.legalName,
        url: base + localePath(locale),
        logo: `${base}/brand/icon-512.png`,
        email: company.email,
        description: t.meta.description,
        address: {
          "@type": "PostalAddress",
          streetAddress: company.office.address[locale],
          addressLocality: "Baku",
          addressCountry: "AZ",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: company.office.phones[0],
            availableLanguage: ["az", "en", "ru"],
            areaServed: "AZ",
          },
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            telephone: company.factory.phones[0],
            availableLanguage: ["az", "ru"],
          },
        ],
        location: {
          "@type": "Place",
          name: t.contact.factory,
          address: {
            "@type": "PostalAddress",
            streetAddress: company.factory.address[locale],
            addressLocality: "Baku",
            addressCountry: "AZ",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: company.factory.geo.lat,
            longitude: company.factory.geo.lng,
          },
        },
        knowsAbout: [
          "workwear",
          "corporate uniforms",
          "personal protective equipment",
          "embroidery",
          "garment manufacturing",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base + localePath(locale),
        name: company.name,
        inLanguage: locale,
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${base}${localePath(locale, "search")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(
  base: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: base + it.path,
    })),
  };
}

export function productJsonLd(
  locale: Locale,
  base: string,
  p: ProductDetail,
  imageUrls: string[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${base}${localePath(locale, "product", p.slug)}#product`,
    name: p.name,
    sku: p.sku,
    mpn: p.sku,
    description: p.summary,
    image: imageUrls,
    brand: { "@type": "Brand", name: p.brand ?? company.name },
    manufacturer: { "@id": `${base}/#organization` },
    color: p.colors.join(", ") || undefined,
    inLanguage: locale,
    // Offers only when the source data has a real price.
    ...(p.price
      ? {
          offers: {
            "@type": "Offer",
            price: p.price.toFixed(2),
            priceCurrency: p.currency,
            availability: "https://schema.org/InStock",
            url: base + localePath(locale, "product", p.slug),
            seller: { "@id": `${base}/#organization` },
          },
        }
      : {}),
  };
}
