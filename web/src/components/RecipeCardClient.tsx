import FavoriteButton from './FavoriteButton';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cost: number;
  cost_unit: string;
  prep?: string;
  cook: string;
  servings: string;
  category: string;
  vegetarian: boolean;
  gluten_free: boolean;
  dairy_free: boolean;
}

const categoryLabels: Record<string, string> = {
  'costco-copycats/food-court': 'Food Court',
  'costco-copycats/deli': 'Deli',
  'costco-copycats/bakery': 'Bakery',
  'costco-copycats/international': 'International',
  'weeknight-dinners': 'Weeknight',
  'rotisserie-chicken': 'Rotisserie',
  'feeding-a-crowd': 'Crowd',
  'meal-prep': 'Meal Prep',
  'slow-cooker': 'Slow Cooker',
  'appetizers': 'Appetizers',
  'desserts': 'Desserts',
  'drinks': 'Drinks',
  'grilling': 'Grilling',
  'salads': 'Salads',
  'snacks': 'Snacks',
  'soups': 'Soups',
};

const categoryImageMap: Record<string, string> = {
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

export default function RecipeCardClient({ recipe }: { recipe: Recipe }) {
  const { id, title, description, cost, cost_unit, prep, cook, servings, category, vegetarian, gluten_free, dairy_free } = recipe;
  const href = `/recipes/${id}`;
  const costDisplay = cost_unit === 'serving' ? `$${cost.toFixed(2)}` : `$${cost.toFixed(2)}/${cost_unit}`;
  const label = categoryLabels[category] || category.split('/').pop()?.replace(/-/g, ' ') || '';
  const isBudget = cost <= 2;
  const isQuick = recipe.prep?.includes('10 min') || recipe.prep?.includes('5 min');
  const recipeImage = `/assets/recipes/${id.split('/').pop()}.webp`;
  const categoryImage = categoryImageMap[category] || '/assets/categories/weeknight.webp';

  return (
    <a href={href} class="group block">
      <div class="bg-surface-container-lowest rounded-xl overflow-visible shadow-[0_8px_32px_rgba(47,47,47,0.04)] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.08)] transition-all duration-300">
        <div class="p-3">
          <div class="relative h-44 md:h-56 w-full rounded-lg overflow-hidden bg-surface-container">
            <img src={recipeImage} alt="" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" aria-hidden="true" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = categoryImage; }} />
            <FavoriteButton recipeId={id} />
            {isQuick && (
              <div class="absolute top-3 left-3">
                <span class="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-extrabold shadow-sm">⏱️ Quick</span>
              </div>
            )}
            <div class="absolute bottom-3 right-3">
              <span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase shadow-sm">{label}</span>
            </div>
          </div>
        </div>
        <div class="px-6 pb-6 pt-2">
          <h3 class="font-headline font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          <p class="text-sm text-on-surface-variant line-clamp-2 mb-3">{description}</p>
          <div class="flex items-center gap-4 text-xs text-on-surface-variant">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm" aria-hidden="true">payments</span>
              <span class="font-bold text-tertiary">{costDisplay}</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm" aria-hidden="true">timer</span>
              {cook}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm" aria-hidden="true">group</span>
              {servings}
            </span>
          </div>
          {(vegetarian || gluten_free || dairy_free) && (
            <div class="flex gap-1.5 mt-3">
              {vegetarian && <span class="text-[10px] px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-bold">V</span>}
              {gluten_free && <span class="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">GF</span>}
              {dairy_free && <span class="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">DF</span>}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
