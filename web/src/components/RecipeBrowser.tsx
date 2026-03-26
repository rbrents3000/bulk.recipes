import { useState, useMemo } from 'preact/hooks';
import RecipeCardClient from './RecipeCardClient';

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

function parseCookMinutes(cook: string): number {
  const hrMatch = cook.match(/(\d+)\s*hr/i);
  const minMatch = cook.match(/(\d+)\s*min/i);
  let total = 0;
  if (hrMatch) total += parseInt(hrMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total || 999;
}

const PAGE_SIZE = 12;

const categoryDisplayNames: Record<string, string> = {
  'costco-copycats/food-court': 'Copycats — Food Court',
  'costco-copycats/deli': 'Copycats — Deli',
  'costco-copycats/bakery': 'Copycats — Bakery',
  'costco-copycats/international': 'Copycats — International',
  'weeknight-dinners': 'Weeknight Dinners',
  'rotisserie-chicken': 'Rotisserie Chicken',
  'feeding-a-crowd': 'Feeding a Crowd',
  'meal-prep': 'Meal Prep',
  'slow-cooker': 'Slow Cooker',
  'appetizers': 'Appetizers',
  'desserts': 'Desserts',
  'drinks': 'Drinks',
  'grilling': 'Grilling',
  'salads': 'Salads',
  'snacks': 'Snacks & Lunch',
  'soups': 'Soups',
};

export default function RecipeBrowser({ recipes, categories }: { recipes: Recipe[]; categories: string[] }) {
  const [category, setCategory] = useState<string>('');
  const [maxCost, setMaxCost] = useState(10);
  const [cookTime, setCookTime] = useState<string>('');
  const [vegetarian, setVegetarian] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [dairyFree, setDairyFree] = useState(false);
  const [sortBy, setSortBy] = useState<string>('cheapest');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...recipes];

    if (category) {
      result = result.filter(r => r.category === category || r.category.startsWith(category + '/'));
    }
    if (maxCost < 10) {
      result = result.filter(r => r.cost <= maxCost);
    }
    if (cookTime) {
      result = result.filter(r => {
        const mins = parseCookMinutes(r.cook);
        switch (cookTime) {
          case '<30': return mins <= 30;
          case '30-60': return mins > 30 && mins <= 60;
          case '1-2h': return mins > 60 && mins <= 120;
          case '2h+': return mins > 120;
          default: return true;
        }
      });
    }
    if (vegetarian) result = result.filter(r => r.vegetarian);
    if (glutenFree) result = result.filter(r => r.gluten_free);
    if (dairyFree) result = result.filter(r => r.dairy_free);

    // Sort
    switch (sortBy) {
      case 'cheapest': result.sort((a, b) => a.cost - b.cost); break;
      case 'fastest': result.sort((a, b) => parseCookMinutes(a.cook) - parseCookMinutes(b.cook)); break;
      case 'alpha': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break;
    }

    return result;
  }, [category, maxCost, cookTime, vegetarian, glutenFree, dairyFree, sortBy, recipes]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setCategory('');
    setMaxCost(10);
    setCookTime('');
    setVegetarian(false);
    setGlutenFree(false);
    setDairyFree(false);
    setPage(0);
  };

  const hasFilters = category || maxCost < 10 || cookTime || vegetarian || glutenFree || dairyFree;

  return (
    <div class="py-8">
      {/* Mobile filter toggle */}
      <button
        class="md:hidden w-full mb-6 h-16 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-headline font-extrabold text-lg flex items-center justify-center gap-2 shadow-[0_12px_24px_rgba(186,0,39,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
        onClick={() => setShowFilters(!showFilters)}
      >
        <span class="material-symbols-outlined" aria-hidden="true">tune</span>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      <div class="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside class={`w-full md:w-80 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <h2 class="font-headline text-2xl font-extrabold tracking-tight">Filter by</h2>

          {/* Category */}
          <div class="space-y-3">
            <label class="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest">Category</label>
            <select
              aria-label="Category"
              class="w-full h-14 bg-surface-container-highest border-none rounded-xl px-4 font-medium focus:ring-2 focus:ring-primary"
              value={category}
              onChange={(e) => { setCategory((e.target as HTMLSelectElement).value); setPage(0); }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{categoryDisplayNames[c] || c}</option>
              ))}
            </select>
          </div>

          {/* Cost slider */}
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <label class="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest">Max Cost</label>
              <span class="text-primary font-bold">{maxCost >= 10 ? 'Any' : `Under $${maxCost}`}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={maxCost}
              aria-label="Maximum cost per serving"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={maxCost}
              onInput={(e) => { setMaxCost(parseFloat((e.target as HTMLInputElement).value)); setPage(0); }}
              class="w-full accent-primary h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs font-bold text-on-surface-variant">
              <span>$1</span><span>$10+</span>
            </div>
          </div>

          {/* Cook time */}
          <div class="space-y-3">
            <label class="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest">Cook Time</label>
            <div class="grid grid-cols-2 gap-2">
              {[
                { value: '', label: 'All', ariaLabel: 'All cook times' },
                { value: '<30', label: '⏱️ < 30m', ariaLabel: 'Under 30 minutes' },
                { value: '30-60', label: '⏱️ 30-60m', ariaLabel: '30 to 60 minutes' },
                { value: '1-2h', label: '⏱️ 1-2h', ariaLabel: '1 to 2 hours' },
                { value: '2h+', label: '⏱️ 2h+', ariaLabel: 'Over 2 hours' },
              ].map(opt => (
                <button
                  key={opt.value || 'all'}
                  aria-label={opt.ariaLabel}
                  aria-pressed={cookTime === opt.value}
                  class={`py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                    cookTime === opt.value
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  onClick={() => { setCookTime(opt.value); setPage(0); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diet checkboxes */}
          <div class="space-y-3">
            <label class="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest">Dietary</label>
            <div class="space-y-3">
              {[
                { key: 'vegetarian', label: 'Vegetarian', checked: vegetarian, set: setVegetarian },
                { key: 'gluten_free', label: 'Gluten-Free', checked: glutenFree, set: setGlutenFree },
                { key: 'dairy_free', label: 'Dairy-Free', checked: dairyFree, set: setDairyFree },
              ].map(d => (
                <label key={d.key} class="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={d.checked}
                    onChange={() => { d.set(!d.checked); setPage(0); }}
                    class="w-6 h-6 rounded-md border-outline-variant text-primary focus:ring-primary mr-3"
                  />
                  <span class={`font-medium ${d.checked ? 'font-bold text-primary' : ''}`}>{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              class="text-primary font-bold text-sm hover:underline"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* Main content */}
        <section class="flex-1 space-y-8">
          {/* Sort bar */}
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div aria-live="polite" aria-atomic="true">
              <h1 class="font-headline text-4xl font-extrabold tracking-tight">Bulk Masterpieces</h1>
              <p class="text-on-surface-variant font-medium mt-1">
                {hasFilters ? `Showing ${filtered.length} recipes` : `Showing ${recipes.length} recipes for every occasion`}
              </p>
            </div>
            <div class="flex items-center gap-3 bg-surface-container-low p-1.5 rounded-2xl">
              <span class="text-xs font-bold px-3 text-on-surface-variant">SORT BY</span>
              <select
                aria-label="Sort recipes by"
                class="bg-surface-container-lowest border-none rounded-xl text-sm font-bold py-2 pl-3 pr-8 focus:ring-0"
                value={sortBy}
                onChange={(e) => setSortBy((e.target as HTMLSelectElement).value)}
              >
                <option value="cheapest">Cheapest First</option>
                <option value="fastest">Fastest First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Recipe grid */}
          {paged.length > 0 ? (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paged.map(recipe => (
                <RecipeCardClient key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div class="text-center py-20">
              <span class="material-symbols-outlined text-6xl text-outline-variant mb-4" aria-hidden="true">search_off</span>
              <p class="text-xl font-bold mb-2">No recipes match your filters</p>
              <p class="text-on-surface-variant">Try adjusting your criteria or <button class="text-primary font-bold hover:underline" onClick={clearFilters}>clear all filters</button></p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div class="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  class={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                    page === i
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
                  }`}
                  onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
