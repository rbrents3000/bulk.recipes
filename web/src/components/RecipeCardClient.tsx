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

export default function RecipeCardClient({ recipe }: { recipe: Recipe }) {
  const { id, title, description, cost, cost_unit, cook, servings, category, vegetarian, gluten_free, dairy_free } = recipe;
  const href = `/recipes/${id}`;
  const costDisplay = cost_unit === 'serving' ? `$${cost.toFixed(2)}` : `$${cost.toFixed(2)}/${cost_unit}`;
  const label = categoryLabels[category] || category.split('/').pop()?.replace(/-/g, ' ') || '';
  const isBudget = cost <= 1.5;
  const isPopular = cost <= 2;

  return (
    <a href={href} class="group block">
      <div class="bg-white rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(47,47,47,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(47,47,47,0.08)] transition-all duration-300">
        <div class="p-3">
          <div class="relative h-48 w-full rounded-lg overflow-hidden bg-[#eae8e7]">
            <div class="w-full h-full flex items-center justify-center text-[#5c5b5b]">
              <span class="material-symbols-outlined text-4xl opacity-20">restaurant</span>
            </div>
            <div class="absolute top-3 left-3 flex flex-col gap-1.5">
              {isPopular && <span class="bg-[#fdd34d] text-[#5c4900] px-3 py-1 rounded-full text-[10px] font-extrabold">🔥 POPULAR</span>}
              {isBudget && <span class="bg-white/90 text-[#ba0027] px-3 py-1 rounded-full text-[10px] font-extrabold backdrop-blur">💰 BUDGET</span>}
            </div>
            <div class="absolute bottom-3 right-3">
              <span class="bg-[#fdd34d] text-[#5c4900] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{label}</span>
            </div>
          </div>
        </div>
        <div class="px-5 pb-5 pt-1">
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#ba0027] transition-colors line-clamp-1" style="font-family: 'Plus Jakarta Sans', sans-serif">
            {title}
          </h3>
          <p class="text-sm text-[#5c5b5b] line-clamp-2 mb-3">{description}</p>
          <div class="flex items-center gap-4 text-xs text-[#5c5b5b]">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">payments</span>
              <span class="font-bold text-[#8a4c00]">{costDisplay}</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">timer</span>
              {cook}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">group</span>
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
