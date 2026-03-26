interface Recipe {
  id: string;
  title: string;
  description: string;
  cost: number;
  cost_unit: string;
  prep: string;
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
  'costco-copycats/food-court': '/assets/categories/copycats.png',
  'costco-copycats/deli': '/assets/categories/copycats.png',
  'costco-copycats/bakery': '/assets/categories/desserts.png',
  'costco-copycats/international': '/assets/categories/copycats.png',
  'weeknight-dinners': '/assets/categories/weeknight.png',
  'rotisserie-chicken': '/assets/categories/rotisserie.png',
  'feeding-a-crowd': '/assets/categories/crowd.png',
  'meal-prep': '/assets/categories/meal-prep.png',
  'slow-cooker': '/assets/categories/slow-cooker.png',
  'appetizers': '/assets/categories/appetizers.png',
  'desserts': '/assets/categories/desserts.png',
  'drinks': '/assets/categories/drinks.png',
  'grilling': '/assets/categories/grilling.png',
  'salads': '/assets/categories/salads.png',
  'snacks': '/assets/categories/snacks.png',
  'soups': '/assets/categories/soups.png',
};

export default function RecipeCardClient({ recipe }: { recipe: Recipe }) {
  const { id, title, description, cost, cost_unit, cook, servings, category, vegetarian, gluten_free, dairy_free } = recipe;
  const href = `/recipes/${id}`;
  const costDisplay = cost_unit === 'serving' ? `$${cost.toFixed(2)}` : `$${cost.toFixed(2)}/${cost_unit}`;
  const label = categoryLabels[category] || category.split('/').pop()?.replace(/-/g, ' ') || '';
  const isBudget = cost <= 1.5;
  const isPopular = cost <= 2;
  const categoryImage = categoryImageMap[category] || '/assets/categories/weeknight.png';

  return (
    <a href={href} class="group block">
      <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(47,47,47,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(47,47,47,0.08)] transition-all duration-300">
        <div class="p-3">
          <div class="relative h-48 w-full rounded-lg overflow-hidden bg-surface-container">
            <img src={categoryImage} alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" aria-hidden="true" loading="lazy" />
            <div class="absolute top-3 left-3 flex flex-col gap-1.5">
              {isPopular && <span class="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-extrabold">🔥 POPULAR</span>}
              {isBudget && <span class="bg-white/90 text-primary px-3 py-1 rounded-full text-[10px] font-extrabold backdrop-blur">💰 BUDGET</span>}
            </div>
            <div class="absolute bottom-3 right-3">
              <span class="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{label}</span>
            </div>
          </div>
        </div>
        <div class="px-5 pb-5 pt-1">
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
