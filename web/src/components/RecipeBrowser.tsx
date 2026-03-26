import { useState, useMemo, useEffect } from 'preact/hooks';
import RecipeCardClient from './RecipeCardClient';
import { type Recipe, parseMinutes, effectiveCostPerServing } from '../types/recipe';

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

export default function RecipeBrowser({ recipes, categories, ingredientTags }: { recipes: Recipe[]; categories: string[]; ingredientTags: string[] }) {
  // Read initial filter state from URL params
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const [category, setCategory] = useState<string>(params?.get('category') || '');
  const [maxCost, setMaxCost] = useState(parseFloat(params?.get('maxCost') || '15'));
  const [cookTime, setCookTime] = useState<string>(params?.get('cookTime') || '');
  const [vegetarian, setVegetarian] = useState(params?.get('vegetarian') === '1');
  const [glutenFree, setGlutenFree] = useState(params?.get('glutenFree') === '1');
  const [dairyFree, setDairyFree] = useState(params?.get('dairyFree') === '1');
  const [sortBy, setSortBy] = useState<string>(params?.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(params?.get('page') || '0', 10));
  const [showFilters, setShowFilters] = useState(!!params?.get('filter'));
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(() => {
    const ing = params?.get('ingredients');
    return ing ? new Set(ing.split(',')) : new Set();
  });
  const [searchQuery, setSearchQuery] = useState(params?.get('q') || '');

  // Sync filter state back to URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (searchQuery) p.set('q', searchQuery);
    if (category) p.set('category', category);
    if (maxCost < 15) p.set('maxCost', String(maxCost));
    if (cookTime) p.set('cookTime', cookTime);
    if (vegetarian) p.set('vegetarian', '1');
    if (glutenFree) p.set('glutenFree', '1');
    if (dairyFree) p.set('dairyFree', '1');
    if (sortBy && sortBy !== 'newest') p.set('sort', sortBy);
    if (page > 0) p.set('page', String(page));
    if (selectedIngredients.size > 0) p.set('ingredients', [...selectedIngredients].join(','));
    if (showFilters) p.set('filter', '1');
    const qs = p.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [searchQuery, category, maxCost, cookTime, vegetarian, glutenFree, dairyFree, sortBy, page, selectedIngredients, showFilters]);

  // Hide loading skeleton once mounted
  useEffect(() => {
    const skeleton = document.getElementById('recipe-skeleton');
    if (skeleton) skeleton.style.display = 'none';
  }, []);

  const toggleIngredient = (tag: string) => {
    setSelectedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = [...recipes];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.ingredientTags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (category) {
      result = result.filter(r => r.category === category || r.category.startsWith(category + '/'));
    }
    if (maxCost < 15) {
      result = result.filter(r => effectiveCostPerServing(r) <= maxCost);
    }
    if (cookTime) {
      result = result.filter(r => {
        const mins = parseMinutes(r.cook);
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
    if (selectedIngredients.size > 0) {
      result = result.filter(r =>
        r.ingredientTags.some(t => selectedIngredients.has(t))
      );
    }

    // Sort
    switch (sortBy) {
      case 'cheapest': result.sort((a, b) => effectiveCostPerServing(a) - effectiveCostPerServing(b)); break;
      case 'fastest': result.sort((a, b) => parseMinutes(a.cook) - parseMinutes(b.cook)); break;
      case 'total-time': result.sort((a, b) =>
        (parseMinutes(a.prep || '') + parseMinutes(a.cook))
        - (parseMinutes(b.prep || '') + parseMinutes(b.cook))
      ); break;
      case 'alpha': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break;
    }

    return result;
  }, [searchQuery, category, maxCost, cookTime, vegetarian, glutenFree, dairyFree, selectedIngredients, sortBy, recipes]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setMaxCost(15);
    setCookTime('');
    setVegetarian(false);
    setGlutenFree(false);
    setDairyFree(false);
    setSelectedIngredients(new Set());
    setPage(0);
  };

  const hasFilters = searchQuery || category || maxCost < 15 || cookTime || vegetarian || glutenFree || dairyFree || selectedIngredients.size > 0;

  const activeFilterCount = [
    searchQuery,
    category,
    maxCost < 15,
    cookTime,
    vegetarian,
    glutenFree,
    dairyFree,
    selectedIngredients.size,
  ].filter(Boolean).length;

  return (
    <div class="py-8 overflow-x-hidden">
      {/* Mobile filter toggle */}
      <button
        class="md:hidden w-full mb-6 h-12 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-full font-headline font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_12px_24px_rgba(186,0,39,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
        onClick={() => setShowFilters(!showFilters)}
        aria-expanded={showFilters}
        aria-controls="filter-sidebar"
      >
        <span class="material-symbols-outlined" aria-hidden="true">tune</span>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
        {activeFilterCount > 0 && (
          <span class="ml-1 w-6 h-6 bg-white text-primary rounded-full text-xs font-extrabold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      <div class="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside id="filter-sidebar" class={`w-full md:w-56 lg:w-64 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
          {/* Search */}
          <div class="relative">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" aria-hidden="true">search</span>
            <input
              type="text"
              placeholder="Search recipes..."
              aria-label="Search recipes"
              value={searchQuery}
              onInput={(e) => { setSearchQuery((e.target as HTMLInputElement).value); setPage(0); }}
              class="w-full h-14 bg-surface-container-highest border-none rounded-xl pl-11 pr-10 font-medium focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/50"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(0); }}
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-container transition-colors"
                aria-label="Clear search"
              >
                <span class="material-symbols-outlined text-on-surface-variant text-lg" aria-hidden="true">close</span>
              </button>
            )}
          </div>

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
              <span class="text-primary font-bold">{maxCost >= 15 ? 'Any' : `Under $${maxCost}`}</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={maxCost}
              aria-label="Maximum cost per unit"
              aria-valuemin={1}
              aria-valuemax={15}
              aria-valuenow={maxCost}
              onInput={(e) => { setMaxCost(parseFloat((e.target as HTMLInputElement).value)); setPage(0); }}
              class="w-full accent-primary h-2 bg-surface-container-highest rounded-full appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs font-bold text-on-surface-variant">
              <span>$1</span><span>$15+</span>
            </div>
          </div>

          {/* Cook time */}
          <div class="space-y-3">
            <label class="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest">Cook Time</label>
            <div class="grid grid-cols-2 gap-2">
              {[
                { value: '', label: 'All', ariaLabel: 'All cook times' },
                { value: '<30', label: '< 30m', ariaLabel: 'Under 30 minutes' },
                { value: '30-60', label: '30-60m', ariaLabel: '30 to 60 minutes' },
                { value: '1-2h', label: '1-2h', ariaLabel: '1 to 2 hours' },
                { value: '2h+', label: '2h+', ariaLabel: 'Over 2 hours' },
              ].map(opt => (
                <button
                  key={opt.value || 'all'}
                  aria-label={opt.ariaLabel}
                  aria-pressed={cookTime === opt.value}
                  class={`py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                    cookTime === opt.value
                      ? 'bg-primary text-white'
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
                    class="w-6 h-6 rounded-md border-outline-variant accent-primary text-primary focus:ring-primary mr-3"
                  />
                  <span class={`font-medium ${d.checked ? 'font-bold text-primary' : ''}`}>{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          {ingredientTags.length > 0 && (
            <div class="space-y-3">
              <label class="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-widest">Ingredients</label>
              <div class="flex flex-wrap gap-2">
                {ingredientTags.map(tag => (
                  <button
                    key={tag}
                    aria-pressed={selectedIngredients.has(tag)}
                    class={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedIngredients.has(tag)
                        ? 'bg-primary text-white border border-primary'
                        : 'bg-surface-container-highest text-on-surface-variant border border-transparent hover:bg-surface-container-high'
                    }`}
                    onClick={() => toggleIngredient(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                class="bg-surface-container-lowest border-none rounded-xl text-sm font-bold py-2 pl-3 pr-10 focus:ring-0 min-w-[160px]"
                value={sortBy}
                onChange={(e) => { setSortBy((e.target as HTMLSelectElement).value); setPage(0); }}
              >
                <option value="newest">Newest First</option>
                <option value="cheapest">Cheapest First</option>
                <option value="fastest">Fastest First</option>
                <option value="total-time">Quickest Total</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Recipe grid */}
          {paged.length > 0 ? (
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
            <div class="flex justify-center items-center gap-2 mt-8 mb-8">
              <button
                class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-container-highest"
                disabled={page === 0}
                onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-label="Previous page"
              >
                <span class="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              {(() => {
                const pages: (number | '...')[] = [];
                if (totalPages <= 7) {
                  for (let i = 0; i < totalPages; i++) pages.push(i);
                } else {
                  pages.push(0);
                  if (page > 2) pages.push('...');
                  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
                  if (page < totalPages - 3) pages.push('...');
                  pages.push(totalPages - 1);
                }
                return pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} class="px-2 text-on-surface-variant">...</span>
                  ) : (
                    <button
                      key={p}
                      aria-label={`Page ${(p as number) + 1}`}
                      aria-current={page === p ? 'page' : undefined}
                      class={`w-12 h-12 rounded-full font-bold text-sm transition-all ${
                        page === p
                          ? 'bg-primary text-white shadow-lg scale-105'
                          : 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high'
                      }`}
                      onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                );
              })()}
              <button
                class="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-surface-container-highest"
                disabled={page === totalPages - 1}
                onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                aria-label="Next page"
              >
                <span class="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
