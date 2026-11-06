// "Recommended" order: core garments first (the factory's own products), then PPE and accessories.
const typeOrder = [
  "workwear-sets",
  "jackets",
  "vests",
  "bib-overalls",
  "coveralls",
  "welder-sets",
  "shirts",
  "medical-wear",
  "chef-waiter",
  "fleeces",
  "rainwear",
  "footwear",
  "gloves",
  "head-protection",
  "eye-protection",
  "hearing-protection",
  "respiratory",
  "signaling",
  "disposable",
];

export function recommendedRank(categories: string[]): number {
  const i = typeOrder.findIndex((k) => categories.includes(`type:${k}`));
  return i === -1 ? typeOrder.length : i;
}

export function byRecommended<
  T extends { categories: string[]; position: number; image: unknown },
>(a: T, b: T) {
  return (
    Number(!a.image) - Number(!b.image) ||
    recommendedRank(a.categories) - recommendedRank(b.categories) ||
    a.position - b.position
  );
}
