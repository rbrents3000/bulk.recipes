/** Canonical category → display name mapping. Used by RecipeCard, RecipeBrowser, and country pages. */
export const categoryLabels: Record<string, string> = {
  'costco-copycats/food-court': 'Food Court',
  'costco-copycats/deli': 'Deli',
  'costco-copycats/bakery': 'Bakery',
  'costco-copycats/international': 'International',
  'weeknight-dinners': 'Weeknight',
  'rotisserie-chicken': 'Rotisserie',
  'feeding-a-crowd': 'Crowd',
  'meal-prep': 'Meal Prep',
  'slow-cooker': 'Slow Cooker',
  'appetizers': 'Appetizers',
  'desserts': 'Desserts',
  'drinks': 'Drinks',
  'grilling': 'Grilling',
  'salads': 'Salads',
  'snacks': 'Snacks',
  'soups': 'Soups',
};

/** Longer display names for the RecipeBrowser filter dropdown. */
export const categoryDisplayNames: Record<string, string> = {
  'costco-copycats/food-court': 'Copycats — Food Court',
  'costco-copycats/deli': 'Copycats — Deli',
  'costco-copycats/bakery': 'Copycats — Bakery',
  'costco-copycats/international': 'Copycats — International',
  'weeknight-dinners': 'Weeknight Dinners',
  'rotisserie-chicken': 'Rotisserie Chicken',
  'feeding-a-crowd': 'Feeding a Crowd',
  'meal-prep': 'Meal Prep',
  'slow-cooker': 'Slow Cooker',
  'appetizers': 'Appetizers',
  'desserts': 'Desserts',
  'drinks': 'Drinks',
  'grilling': 'Grilling',
  'salads': 'Salads',
  'snacks': 'Snacks & Lunch',
  'soups': 'Soups',
};

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] || category.split('/').pop()?.replace(/-/g, ' ') || category;
}
