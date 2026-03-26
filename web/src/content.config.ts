import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recipes = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: '../recipes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    card_description: z.string().optional(),
    prep: z.string(),
    cook: z.string(),
    servings: z.string(),
    cost: z.number(),
    cost_unit: z.string(),
    category: z.string(),
    vegetarian: z.boolean(),
    gluten_free: z.boolean(),
    dairy_free: z.boolean(),
    costco_ingredients: z.array(z.string()).optional().default([]),
    other_ingredients: z.array(z.string()).optional().default([]),
    instructions: z.array(z.string()).optional().default([]),
    storage: z.string().optional().default(''),
    leftover_ideas: z.array(z.string()).optional().default([]),
    nutrition: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }).optional(),
  }),
});

export const collections = { recipes };
