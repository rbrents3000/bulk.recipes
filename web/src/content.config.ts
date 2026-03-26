import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const recipes = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/README.md'], base: '../recipes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    prep: z.string(),
    cook: z.string(),
    servings: z.string(),
    cost: z.number(),
    cost_unit: z.string(),
    category: z.string(),
    vegetarian: z.boolean(),
    gluten_free: z.boolean(),
    dairy_free: z.boolean(),
  }),
});

export const collections = { recipes };
