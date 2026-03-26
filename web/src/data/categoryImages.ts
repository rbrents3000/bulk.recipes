export const categoryImageMap: Record<string, string> = {
  'costco-copycats/food-court': '/assets/categories/copycats.webp',
  'costco-copycats/deli': '/assets/categories/copycats.webp',
  'costco-copycats/bakery': '/assets/categories/desserts.webp',
  'costco-copycats/international': '/assets/categories/copycats.webp',
  'weeknight-dinners': '/assets/categories/weeknight.webp',
  'rotisserie-chicken': '/assets/categories/rotisserie.webp',
  'feeding-a-crowd': '/assets/categories/crowd.webp',
  'meal-prep': '/assets/categories/meal-prep.webp',
  'slow-cooker': '/assets/categories/slow-cooker.webp',
  'appetizers': '/assets/categories/appetizers.webp',
  'desserts': '/assets/categories/desserts.webp',
  'drinks': '/assets/categories/drinks.webp',
  'grilling': '/assets/categories/grilling.webp',
  'salads': '/assets/categories/salads.webp',
  'snacks': '/assets/categories/snacks.webp',
  'soups': '/assets/categories/soups.webp',
};

export const DEFAULT_CATEGORY_IMAGE = '/assets/categories/weeknight.webp';

export function getCategoryImage(category: string): string {
  return categoryImageMap[category] || DEFAULT_CATEGORY_IMAGE;
}
