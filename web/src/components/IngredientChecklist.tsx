import { useState } from 'preact/hooks';
import { getChecked, setChecked } from '../utils/checkedIngredients';

interface Props {
  items: string[];
  recipeId: string;
}

export default function IngredientChecklist({ items, recipeId }: Props) {
  const [checked, setCheckedState] = useState(() => getChecked(recipeId));

  const toggle = (index: number) => {
    setCheckedState(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      setChecked(recipeId, next);
      return next;
    });
  };

  const progress = items.length > 0 ? (checked.size / items.length) * 100 : 0;

  return (
    <div class="bg-surface-container-lowest shadow-lg rounded-xl p-5 md:p-8">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2 font-headline">
        <span class="material-symbols-outlined text-primary" aria-hidden="true">receipt_long</span>
        Costco List
        <span class="ml-auto bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center font-black font-headline border-2 border-on-primary" aria-hidden="true">
          <span class="text-[8px] leading-tight tracking-wide text-center">KIRK<br/>LAND</span>
        </span>
      </h3>

      {/* Progress bar */}
      <div class="mb-6">
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-xs font-bold text-on-surface-variant">{checked.size} of {items.length} items</span>
          {checked.size === items.length && items.length > 0 && (
            <span class="text-xs font-bold text-green-700">All done!</span>
          )}
        </div>
        <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul class="space-y-3" data-scalable="costco">
        {items.map((item, i) => (
          <li key={i} class="transition-all duration-300">
            <label class="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggle(i)}
                class="w-6 h-6 rounded-md border-outline-variant text-primary focus:ring-primary mt-0.5 transition-all duration-200"
              />
              <span class={`font-bold text-sm ingredient-text transition-all duration-300 ${
                checked.has(i)
                  ? 'line-through text-on-surface-variant translate-x-1'
                  : 'group-hover:text-primary'
              }`}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
