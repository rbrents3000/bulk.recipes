import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipes, getRecipeWithProducts, categoryLabels } from "@/lib/data";

export function generateStaticParams() {
  return getRecipes().map((recipe) => ({ id: recipe.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getRecipeWithProducts(id);
  if (!data) return { title: "Recipe Not Found" };
  return {
    title: `${data.title} — bulk.recipes`,
    description: data.description,
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getRecipeWithProducts(id);
  if (!data) notFound();

  const totalTime = data.prepTimeMinutes + data.cookTimeMinutes;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to recipes
      </Link>

      <span className="inline-block rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium mb-3">
        {categoryLabels[data.category]}
      </span>

      <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        {data.title}
      </h1>
      <p className="mt-3 text-lg text-gray-600">{data.description}</p>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600 border-y border-gray-200 py-4">
        <div>
          <span className="font-medium text-gray-900">Prep:</span>{" "}
          {data.prepTimeMinutes} min
        </div>
        <div>
          <span className="font-medium text-gray-900">Cook:</span>{" "}
          {data.cookTimeMinutes} min
        </div>
        <div>
          <span className="font-medium text-gray-900">Total:</span>{" "}
          {totalTime} min
        </div>
        <div>
          <span className="font-medium text-gray-900">Servings:</span>{" "}
          {data.servings}
        </div>
        <div>
          <span className="font-medium text-gray-900">Difficulty:</span>{" "}
          {data.difficulty}
        </div>
        <div className="ml-auto font-semibold text-green-700">
          ${data.costEstimate.perServing.toFixed(2)}/serving · $
          {data.costEstimate.total.toFixed(2)} total
        </div>
      </div>

      {/* Costco Products */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Costco Shopping List
        </h2>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <ul className="space-y-3">
            {data.resolvedProducts.map((rp) => (
              <li key={rp.productId} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                  C
                </span>
                <div>
                  <span className="font-medium text-gray-900">
                    {rp.product?.name || rp.productId}
                  </span>
                  <span className="text-gray-600"> — {rp.amountNeeded}</span>
                  {rp.product && (
                    <span className="text-sm text-gray-500 block">
                      ~${rp.product.approximatePrice.toFixed(2)} ·{" "}
                      {rp.product.packageSize}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Other Ingredients */}
      {data.additionalIngredients.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Other Ingredients
          </h2>
          <ul className="space-y-2">
            {data.additionalIngredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                <span>
                  {ing.amount} {ing.unit} {ing.name}
                  {ing.optional && (
                    <span className="text-sm text-gray-400 ml-1">
                      (optional)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructions */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Instructions
        </h2>
        <ol className="space-y-6">
          {data.instructions.map((step) => (
            <li key={step.step} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                {step.step}
              </span>
              <div className="pt-1">
                <p className="text-gray-700">{step.text}</p>
                {step.tip && (
                  <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    Tip: {step.tip}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Storage */}
      <section className="mt-8 rounded-lg bg-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-1">Storage</h3>
        <p className="text-sm text-gray-600">{data.storageInstructions}</p>
      </section>

      {/* Leftover Ideas */}
      {data.leftoverIdeas && data.leftoverIdeas.length > 0 && (
        <section className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Leftover Ideas</h3>
          <ul className="space-y-1">
            {data.leftoverIdeas.map((idea, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                {idea}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tags */}
      <div className="mt-8 flex flex-wrap gap-2">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
