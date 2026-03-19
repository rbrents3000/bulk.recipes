import { getRecipes, categoryLabels } from "@/lib/data";
import RecipeCard from "@/components/RecipeCard";
import { RecipeCategory } from "@/lib/types";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return <HomeContent searchParamsPromise={searchParams} />;
}

async function HomeContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ category?: string }>;
}) {
  const { category } = await searchParamsPromise;
  const allRecipes = getRecipes();
  const recipes = category
    ? allRecipes.filter((r) => r.category === category)
    : allRecipes;

  const usedCategories = [
    ...new Set(allRecipes.map((r) => r.category)),
  ] as RecipeCategory[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          <span className="text-red-600">Bulk</span> Recipes
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Recipes designed around Costco ingredients. No fluff, no life stories
          — just what to buy and how to cook it.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <a
          href="/"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !category
              ? "bg-red-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          All
        </a>
        {usedCategories.map((cat) => (
          <a
            key={cat}
            href={`/?category=${cat}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {categoryLabels[cat]}
          </a>
        ))}
      </div>

      {recipes.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          No recipes found for this category yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
