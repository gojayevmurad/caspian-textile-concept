// Canonical taxonomy used to seed the database. Admins can edit names/descriptions later.
// `legacy` lists decoded slugs from the old WooCommerce/WPML site (all languages) that map here.
import type { Locale } from "@/src/lib/i18n/config";

type Names = Record<Locale, string>;
export type TaxonomyEntry = {
  kind: "industry" | "type" | "feature";
  key: string;
  names: Names;
  descriptions?: Names;
  icon?: string;
  legacy: string[];
};

export const taxonomy: TaxonomyEntry[] = [
  // Industries
  {
    kind: "industry",
    key: "construction",
    icon: "hard-hat",
    names: {
      az: "Tikinti və ağır sənaye",
      en: "Construction & heavy industry",
      ru: "Строительство и тяжёлая промышленность",
    },
    descriptions: {
      az: "Tikinti meydançaları, neft-qaz və istehsalat üçün davamlı iş dəstləri, kombinezonlar və fərdi mühafizə vasitələri.",
      en: "Durable workwear sets, coveralls and PPE for construction sites, oil & gas and manufacturing.",
      ru: "Прочные рабочие комплекты, комбинезоны и СИЗ для стройплощадок, нефтегазовой отрасли и производства.",
    },
    legacy: [
      "construction-and-heavy-industr",
      "tikinti-və-agir-sənaye",
      "строительство-и-тяжёлая-промышленно",
    ],
  },
  {
    kind: "industry",
    key: "logistics",
    icon: "truck",
    names: {
      az: "Logistika və nəqliyyat",
      en: "Logistics & transport",
      ru: "Логистика и транспорт",
    },
    descriptions: {
      az: "Anbar, çatdırılma və nəqliyyat əməkdaşları üçün görünən, rahat və möhkəm geyimlər.",
      en: "High-visibility, comfortable and tough clothing for warehouse, delivery and transport teams.",
      ru: "Заметная, удобная и прочная одежда для складов, доставки и транспорта.",
    },
    legacy: [
      "logistics-and-transport",
      "logistika-və-nəqliyyat",
      "логистика-и-транспорт",
    ],
  },
  {
    kind: "industry",
    key: "healthcare",
    icon: "stethoscope",
    names: {
      az: "Səhiyyə və tibb",
      en: "Healthcare & medicine",
      ru: "Здравоохранение и медицина",
    },
    descriptions: {
      az: "Klinika və laboratoriyalar üçün tibbi geyim, xalatlar və birdəfəlik mühafizə vasitələri.",
      en: "Medical wear, lab coats and disposable protection for clinics and laboratories.",
      ru: "Медицинская одежда, халаты и одноразовые средства защиты для клиник и лабораторий.",
    },
    legacy: [
      "healthcare-and-medicine",
      "səhiyyə-və-tibb",
      "здравоохранение-и-медицина",
    ],
  },
  {
    kind: "industry",
    key: "emergency",
    icon: "siren",
    names: {
      az: "Fövqəladə hallar və xilasetmə",
      en: "Emergency & rescue services",
      ru: "Аварийно-спасательные службы",
    },
    legacy: [
      "emergency-and-rescue-services",
      "fovqəladə-hallar-və-xilasetmə-xidmətləri",
      "аварийно-спасательные-службы",
    ],
  },
  {
    kind: "industry",
    key: "corporate",
    icon: "briefcase",
    names: {
      az: "Korporativ və inzibati geyim",
      en: "Corporate & administrative wear",
      ru: "Корпоративная и офисная одежда",
    },
    legacy: [
      "corporate-and-administrative-wear",
      "korporativ-və-inzibati-geyimlər",
    ],
  },
  {
    kind: "industry",
    key: "education",
    icon: "graduation-cap",
    names: {
      az: "Təhsil və məktəb",
      en: "Education & schools",
      ru: "Образование и школы",
    },
    legacy: ["education-and-school", "təhsil-və-məktəb"],
  },
  {
    kind: "industry",
    key: "hospitality",
    icon: "chef-hat",
    names: {
      az: "Qonaqpərvərlik və iaşə",
      en: "Hospitality & catering",
      ru: "Гостеприимство и общепит",
    },
    legacy: ["hospitality-and-catering", "chef-set", "water-set"],
  },
  {
    kind: "industry",
    key: "cleaning",
    icon: "sparkles",
    names: {
      az: "Təmizlik xidmətləri",
      en: "Cleaning services",
      ru: "Клининговые услуги",
    },
    legacy: ["cleaning-service"],
  },
  {
    kind: "industry",
    key: "maintenance",
    icon: "wrench",
    names: {
      az: "Texniki xidmət və təmir",
      en: "Maintenance & repair",
      ru: "Техобслуживание и ремонт",
    },
    legacy: ["maintenance-repair"],
  },
  // Product types
  {
    kind: "type",
    key: "workwear-sets",
    names: { az: "İş dəstləri", en: "Workwear sets", ru: "Рабочие комплекты" },
    legacy: [
      "workwear-sets-mechanical",
      "workwear-sets-category",
      "worker-and-engineer-set",
      "işçi-dəstləri",
      "işçi-və-mühəndis-dəsti",
      "рабочие-комплекты",
      "набор-рабочий-и-инженер",
    ],
  },
  {
    kind: "type",
    key: "welder-sets",
    names: {
      az: "Qaynaqçı dəstləri",
      en: "Welder sets",
      ru: "Комплекты сварщика",
    },
    legacy: ["welder-set"],
  },
  {
    kind: "type",
    key: "coveralls",
    names: { az: "Kombinezonlar", en: "Coveralls", ru: "Комбинезоны" },
    legacy: ["coveralls", "coveralls-category", "kombinezonlar", "комбинезоны"],
  },
  {
    kind: "type",
    key: "bib-overalls",
    names: {
      az: "Yarımkombinezonlar",
      en: "Bib overalls",
      ru: "Полукомбинезоны",
    },
    legacy: ["bib-coveralls"],
  },
  {
    kind: "type",
    key: "jackets",
    names: { az: "Gödəkçələr", en: "Jackets", ru: "Куртки" },
    legacy: ["jackets", "gödəkçələr", "куртки"],
  },
  {
    kind: "type",
    key: "vests",
    names: { az: "Jiletlər", en: "Vests", ru: "Жилеты" },
    legacy: ["vests", "jiletlər", "жилеты"],
  },
  {
    kind: "type",
    key: "shirts",
    names: {
      az: "Köynəklər və polo",
      en: "Shirts & polos",
      ru: "Рубашки и поло",
    },
    legacy: ["shirts", "polos", "polo-köynəklər", "köynəklər", "поло"],
  },
  {
    kind: "type",
    key: "fleeces",
    names: { az: "Flis geyimlər", en: "Fleeces", ru: "Флисовая одежда" },
    legacy: ["fleeces"],
  },
  {
    kind: "type",
    key: "rainwear",
    names: { az: "Yağış geyimləri", en: "Rainwear", ru: "Дождевая одежда" },
    legacy: ["rainwear"],
  },
  {
    kind: "type",
    key: "medical-wear",
    names: { az: "Tibbi geyim", en: "Medical wear", ru: "Медицинская одежда" },
    legacy: ["nurse-wear", "lab-coat"],
  },
  {
    kind: "type",
    key: "chef-waiter",
    names: {
      az: "Aşpaz və ofisiant geyimi",
      en: "Chef & waiter wear",
      ru: "Одежда для поваров и официантов",
    },
    legacy: ["chef-set", "water-set"],
  },
  {
    kind: "type",
    key: "footwear",
    names: { az: "İş ayaqqabıları", en: "Safety footwear", ru: "Спецобувь" },
    legacy: ["shoes", "boots", "heels"],
  },
  {
    kind: "type",
    key: "gloves",
    names: { az: "Əlcəklər", en: "Gloves", ru: "Перчатки" },
    legacy: ["gloves"],
  },
  {
    kind: "type",
    key: "respiratory",
    names: {
      az: "Respiratorlar",
      en: "Respiratory protection",
      ru: "Средства защиты дыхания",
    },
    legacy: ["respirators"],
  },
  {
    kind: "type",
    key: "eye-protection",
    names: { az: "Göz mühafizəsi", en: "Eye protection", ru: "Защита глаз" },
    legacy: ["goggles"],
  },
  {
    kind: "type",
    key: "hearing-protection",
    names: {
      az: "Eşitmə mühafizəsi",
      en: "Hearing protection",
      ru: "Защита слуха",
    },
    legacy: ["earmuffs"],
  },
  {
    kind: "type",
    key: "head-protection",
    names: {
      az: "Baş mühafizəsi (kaskalar)",
      en: "Head protection (helmets)",
      ru: "Защита головы (каски)",
    },
    legacy: ["helmet"],
  },
  {
    kind: "type",
    key: "disposable",
    names: {
      az: "Birdəfəlik məhsullar",
      en: "Disposables",
      ru: "Одноразовые изделия",
    },
    legacy: ["disposable"],
  },
  {
    kind: "type",
    key: "signaling",
    names: {
      az: "Siqnal və işıqlandırma",
      en: "Signaling & lighting",
      ru: "Сигнальное и осветительное оборудование",
    },
    legacy: [
      "electronics",
      "illumination",
      "sound",
      "elektronika",
      "электроника",
    ],
  },
  // Features (filter facets)
  {
    kind: "feature",
    key: "high-visibility",
    names: { az: "İşıqqaytaran", en: "High-visibility", ru: "Светоотражающий" },
    legacy: [
      "reflective",
      "high-visibility",
      "işıqqaytaran",
      "светоотражающий",
    ],
  },
  {
    kind: "feature",
    key: "water-resistant",
    names: { az: "Suya davamlı", en: "Water-resistant", ru: "Водостойкий" },
    legacy: ["water-resistant"],
  },
  {
    kind: "feature",
    key: "acid-resistant",
    names: {
      az: "Turşuya davamlı",
      en: "Acid-resistant",
      ru: "Кислотостойкий",
    },
    legacy: ["acid-resistant", "turşuya-davamli", "кислотостойкий"],
  },
  {
    kind: "feature",
    key: "flame-resistant",
    names: { az: "Alova davamlı", en: "Flame-resistant", ru: "Огнестойкий" },
    legacy: ["flame-resistant"],
  },
  {
    kind: "feature",
    key: "cut-resistant",
    names: {
      az: "Kəsilməyə davamlı",
      en: "Cut-resistant",
      ru: "Порезостойкий",
    },
    legacy: ["cut-resistant"],
  },
  {
    kind: "feature",
    key: "mechanical-basic",
    names: {
      az: "Əsas mexaniki mühafizə",
      en: "Basic mechanical protection",
      ru: "Базовая механическая защита",
    },
    legacy: ["basic-mechanical-protection"],
  },
  {
    kind: "feature",
    key: "mechanical-advanced",
    names: {
      az: "Yüksək mexaniki mühafizə",
      en: "Advanced mechanical protection",
      ru: "Повышенная механическая защита",
    },
    legacy: ["advanced-mechanical-protection"],
  },
  {
    kind: "feature",
    key: "winter",
    names: { az: "Qış", en: "Winter", ru: "Зима" },
    legacy: ["winter"],
  },
  {
    kind: "feature",
    key: "summer",
    names: { az: "Yay", en: "Summer", ru: "Лето" },
    legacy: ["summer"],
  },
  {
    kind: "feature",
    key: "demi-season",
    names: { az: "Mövsümlərarası", en: "Demi-season", ru: "Демисезонный" },
    legacy: ["demi-season", "mövsümlərarası", "демисезонный"],
  },
];

export const colorNames: Record<string, Names & { hex: string }> = {
  blue: { az: "Göy", en: "Blue", ru: "Синий", hex: "#1f4fa3" },
  white: { az: "Ağ", en: "White", ru: "Белый", hex: "#ffffff" },
  gray: { az: "Boz", en: "Gray", ru: "Серый", hex: "#8a8f98" },
  black: { az: "Qara", en: "Black", ru: "Чёрный", hex: "#16181d" },
  green: { az: "Yaşıl", en: "Green", ru: "Зелёный", hex: "#2f7d32" },
  red: { az: "Qırmızı", en: "Red", ru: "Красный", hex: "#c62828" },
  yellow: { az: "Sarı", en: "Yellow", ru: "Жёлтый", hex: "#f2c200" },
  orange: { az: "Narıncı", en: "Orange", ru: "Оранжевый", hex: "#f26b1d" },
  brown: { az: "Qəhvəyi", en: "Brown", ru: "Коричневый", hex: "#6d4c41" },
};
const colorAliases: Record<string, string> = {
  blue: "blue",
  göy: "blue",
  синий: "blue",
  white: "white",
  ağ: "white",
  белый: "white",
  gray: "gray",
  grey: "gray",
  boz: "gray",
  серый: "gray",
  black: "black",
  qara: "black",
  черный: "black",
  чёрный: "black",
  green: "green",
  yaşıl: "green",
  зеленый: "green",
  зелёный: "green",
  red: "red",
  qırmızı: "red",
  красный: "red",
  yellow: "yellow",
  sarı: "yellow",
  желтый: "yellow",
  жёлтый: "yellow",
  orange: "orange",
  brown: "brown",
};
export const normalizeColor = (raw: string) =>
  colorAliases[raw.trim().toLowerCase()] ?? null;
