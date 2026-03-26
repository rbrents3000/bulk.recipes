export interface Recipe {
  id: string;
  title: string;
  description: string;
  card_description?: string;
  cost: number;
  cost_unit: string;
  prep: string;
  cook: string;
  servings: string;
  category: string;
  vegetarian: boolean;
  gluten_free: boolean;
  dairy_free: boolean;
  ingredientTags: string[];
}

export function parseMinutes(s: string): number {
  const hrMatch = s.match(/(\d+)\s*hr/i);
  const minMatch = s.match(/(\d+)\s*min/i);
  let total = 0;
  if (hrMatch) total += parseInt(hrMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total || 999;
}

export function isQuickPrep(prep: string): boolean {
  const mins = parseMinutes(prep);
  return mins > 0 && mins <= 15;
}

export function effectiveCostPerServing(recipe: Recipe): number {
  if (recipe.cost_unit === 'batch' || recipe.cost_unit === 'total') {
    const servings = parseInt(recipe.servings) || 1;
    return recipe.cost / servings;
  }
  return recipe.cost;
}
