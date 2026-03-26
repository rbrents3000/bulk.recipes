// Normalization rules: map Costco ingredient name patterns to short canonical tags.
// Order matters — first match wins.
const RULES: { pattern: RegExp; tag: string }[] = [
  { pattern: /butter/i, tag: 'Butter' },
  { pattern: /large eggs|cage.free eggs/i, tag: 'Eggs' },
  { pattern: /chicken thighs/i, tag: 'Chicken Thighs' },
  { pattern: /chicken breasts/i, tag: 'Chicken Breasts' },
  { pattern: /rotisserie chicken/i, tag: 'Rotisserie Chicken' },
  { pattern: /ground beef/i, tag: 'Ground Beef' },
  { pattern: /bacon/i, tag: 'Bacon' },
  { pattern: /salmon/i, tag: 'Salmon' },
  { pattern: /shrimp/i, tag: 'Shrimp' },
  { pattern: /mexican.*cheese|shredded mexican/i, tag: 'Mexican Cheese' },
  { pattern: /mozzarella/i, tag: 'Mozzarella' },
  { pattern: /parmigiano|parmesan/i, tag: 'Parmesan' },
  { pattern: /sharp cheddar/i, tag: 'Sharp Cheddar' },
  { pattern: /heavy.*cream|whipping cream/i, tag: 'Heavy Cream' },
  { pattern: /sour cream/i, tag: 'Sour Cream' },
  { pattern: /olive oil/i, tag: 'Olive Oil' },
  { pattern: /sesame oil/i, tag: 'Sesame Oil' },
  { pattern: /coconut oil/i, tag: 'Coconut Oil' },
  { pattern: /jasmine rice/i, tag: 'Jasmine Rice' },
  { pattern: /flour tortillas/i, tag: 'Flour Tortillas' },
  { pattern: /chicken broth/i, tag: 'Chicken Broth' },
  { pattern: /diced tomatoes/i, tag: 'Diced Tomatoes' },
  { pattern: /marinara|rao/i, tag: 'Marinara Sauce' },
  { pattern: /chocolate chips/i, tag: 'Chocolate Chips' },
  { pattern: /honey(?! garlic)/i, tag: 'Honey' },
  { pattern: /mayonnaise/i, tag: 'Mayo' },
];

/**
 * Extract a normalized ingredient tag from a costco_ingredient string.
 * Expects format: "Product Name — quantity (~$price, pack info)"
 * Returns null if no rule matches.
 */
export function extractTag(raw: string): string | null {
  const name = raw.split(' — ')[0];
  for (const { pattern, tag } of RULES) {
    if (pattern.test(name)) return tag;
  }
  return null;
}
