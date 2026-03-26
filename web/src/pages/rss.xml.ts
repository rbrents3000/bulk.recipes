import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const recipes = await getCollection('recipes');

  return rss({
    title: 'bulk.recipes',
    description: 'The unofficial field guide to cooking with Costco groceries. New recipes, copycat deli items, and seasonal Costco finds.',
    site: context.site!.toString(),
    items: recipes
      .sort((a, b) => a.data.title.localeCompare(b.data.title))
      .map(recipe => ({
        title: recipe.data.title,
        description: recipe.data.description,
        link: `/recipes/${recipe.id}/`,
      })),
    customData: '<language>en-us</language>',
  });
}
