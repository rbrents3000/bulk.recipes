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

  return (
    <div class="bg-surface-container-lowest shadow-lg rounded-xl p-5 md:p-8">
      <h3 class="text-xl font-bold mb-6 flex items-center gap-2 font-headline">
        <span class="material-symbols-outlined text-primary" aria-hidden="true">receipt_long</span>
        Costco List
        <span class="ml-auto bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center font-black font-headline border-2 border-on-primary" aria-hidden="true">
          <span class="text-[8px] leading-tight tracking-wide text-center">KIRK<br/>LAND</span>
        </span>
      </h3>
      <ul class="space-y-4" data-scalable="costco">
        {items.map((item, i) => (
          <li key={i}>
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggle(i)}
                class="w-6 h-6 rounded-md border-outline-variant text-primary focus:ring-primary mt-0.5"
              />
              <span class={`font-bold text-sm ingredient-text ${checked.has(i) ? 'line-through text-on-surface-variant' : ''}`}>
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
