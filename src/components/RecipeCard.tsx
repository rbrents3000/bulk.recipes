import Link from "next/link";
import { Recipe } from "@/lib/types";
import { categoryLabels } from "@/lib/data";

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-600 mb-1">
            {categoryLabels[recipe.category]}
          </p>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
            {recipe.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {recipe.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {totalTime} min
        </span>
        <span>·</span>
        <span>{recipe.servings} servings</span>
        <span>·</span>
        <span className="font-medium text-green-700">
          ${recipe.costEstimate.perServing.toFixed(2)}/serving
        </span>
        <span
          className={`ml-auto inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}
        >
          {recipe.difficulty}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {recipe.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
