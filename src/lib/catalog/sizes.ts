// Default size ranges per product type (admins can override per product).
export function defaultSizes(categories: string[]): string[] {
  if (categories.includes("type:footwear"))
    return [
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
      "43",
      "44",
      "45",
      "46",
      "47",
    ];
  if (categories.includes("type:gloves")) return ["7", "8", "9", "10", "11"];
  const apparel = [
    "workwear-sets",
    "welder-sets",
    "coveralls",
    "bib-overalls",
    "jackets",
    "vests",
    "shirts",
    "fleeces",
    "rainwear",
    "medical-wear",
    "chef-waiter",
  ];
  if (apparel.some((k) => categories.includes(`type:${k}`)))
    return ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  return [];
}
