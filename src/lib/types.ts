export type CostcoCategory =
  | "food-court"
  | "deli"
  | "bakery"
  | "kirkland"
  | "bulk-grocery";

export type RecipeCategory =
  | "rotisserie-chicken"
  | "copycat-food-court"
  | "meal-prep"
  | "feeding-a-crowd"
  | "use-it-up"
  | "budget"
  | "weeknight-dinner"
  | "breakfast"
  | "dessert"
  | "side-dish"
  | "appetizer";

export type Difficulty = "easy" | "medium" | "hard";

export interface CostcoProduct {
  id: string;
  name: string;
  category: CostcoCategory;
  approximatePrice: number;
  packageSize: string;
  description?: string;
}

export interface RecipeProduct {
  productId: string;
  amountNeeded: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  optional?: boolean;
}

export interface Instruction {
  step: number;
  text: string;
  tip?: string;
}

export interface CostEstimate {
  total: number;
  perServing: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  tags: string[];
  costcoProducts: RecipeProduct[];
  additionalIngredients: Ingredient[];
  costEstimate: CostEstimate;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: Difficulty;
  instructions: Instruction[];
  storageInstructions: string;
  leftoverIdeas?: string[];
  relatedRecipes?: string[];
  image?: string;
}
