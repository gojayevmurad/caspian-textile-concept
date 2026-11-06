// Public company facts, as published on caspiantextile.com (Contact page) and jobsearch.az.
// Edited in the admin "Content" module in a real deployment; kept here as the seed/fallback.
export const company = {
  legalName: "Caspian Textile MMC",
  name: "Caspian Textile",
  email: "info@caspiantextile.com",
  office: {
    address: {
      az: "Cəfər Cabbarlı küç. 44, Caspian Plaza, 3-cü blok, ofis 506, Bakı",
      en: "44 Jafar Jabbarli St, Caspian Plaza, block 3, office 506, Baku",
      ru: "ул. Джафара Джаббарлы 44, Caspian Plaza, 3-й блок, офис 506, Баку",
    },
    phones: ["+994 12 311 39 49", "+994 50 523 50 00"],
  },
  factory: {
    address: {
      az: "Lökbatan, Qobu Park 3, bina 25, Bakı",
      en: "Lokbatan, Qobu Park 3, bldg 25, Baku",
      ru: "Локбатан, Гобу Парк 3, здание 25, Баку",
    },
    phones: ["+994 12 545 20 63", "+994 50 582 50 00"],
    geo: { lat: 40.342921, lng: 49.752713 },
  },
  whatsapp: "+994505825000",
  sameAs: [] as string[],
} as const;

export const tel = (phone: string) => "tel:" + phone.replace(/[^+\d]/g, "");
