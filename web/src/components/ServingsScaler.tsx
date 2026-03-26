import { useState, useEffect, useRef } from 'preact/hooks';

interface Props {
  baseServings: number;
  baseCost: number;
  costUnit: string;
}

// Numbers we should NOT scale (temperatures, sizes, item numbers)
const SKIP_PATTERNS = /(\d+)\s*°[FC]|(\d+)-inch|(\d+)-minute|(\d+)-hour|#\d+|Item\s*#/i;

// Quantity patterns we SHOULD scale
const QTY_PATTERN = /(\d+\.?\d*)\s*(lbs?|pounds?|oz|ounces?|cups?|tbsp|tsp|tablespoons?|teaspoons?|cloves?|sprigs?|slices?|pieces?|strips?|fillets?|pack|bags?|cans?|jars?|bottles?)/gi;

// Fraction patterns like "1/2" or "3/4"
const FRACTION_PATTERN = /(\d+)\/(\d+)\s*(lbs?|pounds?|oz|ounces?|cups?|tbsp|tsp|tablespoons?|teaspoons?)/gi;

function formatQuantity(n: number): string {
  if (n <= 0) return '0';
  const whole = Math.floor(n);
  const frac = +(n - whole).toFixed(2);

  let fracStr = '';
  if (frac >= 0.1 && frac < 0.2) fracStr = '⅛';
  else if (frac >= 0.2 && frac < 0.3) fracStr = '¼';
  else if (frac >= 0.3 && frac < 0.4) fracStr = '⅓';
  else if (frac >= 0.4 && frac < 0.6) fracStr = '½';
  else if (frac >= 0.6 && frac < 0.7) fracStr = '⅔';
  else if (frac >= 0.7 && frac < 0.85) fracStr = '¾';
  else if (frac >= 0.85) return (whole + 1).toString();

  if (whole === 0 && fracStr) return fracStr;
  if (fracStr) return `${whole}${fracStr}`;
  return whole.toString();
}

export default function ServingsScaler({ baseServings, baseCost, costUnit }: Props) {
  const [servings, setServings] = useState(baseServings);
  const originals = useRef<{ el: HTMLElement; html: string }[]>([]);
  const initialized = useRef(false);

  const ratio = servings / baseServings;
  const totalCost = baseCost * ratio * baseServings;
  const costDisplay = costUnit === 'serving'
    ? `$${baseCost.toFixed(2)}/serving`
    : `$${(baseCost * ratio).toFixed(2)}/${costUnit}`;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Find ingredient lists by looking for h2 headings
    const headings = document.querySelectorAll('h2');
    headings.forEach(h2 => {
      const text = h2.textContent || '';
      if (text.includes('Costco Shopping List') || text.includes('Other Ingredients')) {
        // Get the next <ul> sibling
        let next = h2.nextElementSibling;
        while (next && next.tagName !== 'UL') {
          next = next.nextElementSibling;
        }
        if (next) {
          const items = next.querySelectorAll('li');
          items.forEach(li => {
            originals.current.push({ el: li as HTMLElement, html: li.innerHTML });
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!initialized.current) return;

    originals.current.forEach(({ el, html }) => {
      if (ratio === 1) {
        el.innerHTML = html;
        return;
      }

      let scaled = html;

      // Scale fractions like "1/2 teaspoon"
      scaled = scaled.replace(FRACTION_PATTERN, (match, num, den, unit) => {
        const original = parseInt(num) / parseInt(den);
        const newVal = original * ratio;
        return `${formatQuantity(newVal)} ${unit}`;
      });

      // Scale decimal/whole quantities
      scaled = scaled.replace(QTY_PATTERN, (match, num, unit) => {
        // Check if this number is part of a skip pattern
        const idx = scaled.indexOf(match);
        const context = scaled.substring(Math.max(0, idx - 5), idx + match.length + 5);
        if (SKIP_PATTERNS.test(context)) return match;

        const original = parseFloat(num);
        const newVal = original * ratio;
        return `${formatQuantity(newVal)} ${unit}`;
      });

      el.innerHTML = scaled;
    });
  }, [servings, ratio]);

  return (
    <div class="flex flex-col gap-1 min-w-[180px]">
      <div class="flex justify-between items-center">
        <span class="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Servings</span>
        <span class="text-primary font-bold text-lg">{servings}</span>
      </div>
      <input
        type="range"
        min="1"
        max="24"
        value={servings}
        onInput={(e) => setServings(parseInt((e.target as HTMLInputElement).value))}
        class="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div class="flex justify-between text-[10px] text-on-surface-variant">
        <span>1</span>
        <span>24</span>
      </div>
      <div class="mt-1 text-xs text-on-surface-variant">
        {ratio !== 1 && (
          <span>Total: ~${totalCost.toFixed(2)} ({costDisplay})</span>
        )}
      </div>
    </div>
  );
}
