import { CostcoProduct, Recipe, CostcoCategory, RecipeCategory } from "./types";
import fs from "fs";
import path from "path";

export function getProducts(): CostcoProduct[] {
  const filePath = path.join(process.cwd(), "data/products/products.json");
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as CostcoProduct[];
}

export function getProductById(id: string): CostcoProduct | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getProductsByCategory(
  category: CostcoCategory
): CostcoProduct[] {
  return getProducts().filter((p) => p.category === category);
}

export function getRecipes(): Recipe[] {
  const recipesDir = path.join(process.cwd(), "data/recipes");
  const files = fs.readdirSync(recipesDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(recipesDir, file), "utf-8");
    return JSON.parse(content) as Recipe;
  });
}

export function getRecipeById(id: string): Recipe | undefined {
  return getRecipes().find((r) => r.id === id);
}

export function getRecipesByCategory(category: RecipeCategory): Recipe[] {
  return getRecipes().filter((r) => r.category === category);
}

export function getRecipeWithProducts(id: string) {
  const recipe = getRecipeById(id);
  if (!recipe) return undefined;

  const products = recipe.costcoProducts.map((rp) => ({
    ...rp,
    product: getProductById(rp.productId),
  }));

  return { ...recipe, resolvedProducts: products };
}

export const categoryLabels: Record<RecipeCategory, string> = {
  "rotisserie-chicken": "Rotisserie Chicken",
  "copycat-food-court": "Copycat Food Court",
  "meal-prep": "Meal Prep",
  "feeding-a-crowd": "Feeding a Crowd",
  "use-it-up": "Use It Up",
  budget: "Budget Cooking",
  "weeknight-dinner": "Weeknight Dinner",
  breakfast: "Breakfast",
  dessert: "Dessert",
  "side-dish": "Side Dish",
  appetizer: "Appetizer",
};

export const costcoCategoryLabels: Record<CostcoCategory, string> = {
  "food-court": "Food Court",
  deli: "Deli & Prepared",
  bakery: "Bakery",
  kirkland: "Kirkland Signature",
  "bulk-grocery": "Bulk Grocery",
};
