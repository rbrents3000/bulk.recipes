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

// Embedded price pattern like "~$3.99"
const PRICE_PATTERN = /~\$(\d+\.?\d*)/g;

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

const MULTIPLIERS = [0.5, 1, 2, 3, 4];
const LABELS = ['½×', '1×', '2×', '3×', '4×'];

export default function ServingsScaler({ baseServings, baseCost, costUnit }: Props) {
  const [ratio, setRatio] = useState(1);
  const originals = useRef<{ el: HTMLElement; text: string }[]>([]);
  const initialized = useRef(false);

  const scaledServings = Math.round(baseServings * ratio);
  const totalCost = costUnit === 'serving'
    ? baseCost * baseServings * ratio
    : baseCost * ratio;
  const costDisplay = costUnit === 'serving'
    ? `$${baseCost.toFixed(2)}/serving`
    : `$${(baseCost * ratio).toFixed(2)}/${costUnit}`;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const costcoSpans = document.querySelectorAll('[data-scalable="costco"] .ingredient-text');
    const otherSpans = document.querySelectorAll('[data-scalable="other"] > span');

    costcoSpans.forEach(el => {
      originals.current.push({ el: el as HTMLElement, text: el.textContent || '' });
    });
    otherSpans.forEach(el => {
      originals.current.push({ el: el as HTMLElement, text: el.textContent || '' });
    });
  }, []);

  useEffect(() => {
    if (!initialized.current) return;

    originals.current.forEach(({ el, text }) => {
      if (ratio === 1) {
        el.textContent = text;
        return;
      }

      let scaled = text;

      // Scale fractions like "1/2 teaspoon"
      scaled = scaled.replace(FRACTION_PATTERN, (match, num, den, unit) => {
        const original = parseInt(num) / parseInt(den);
        const newVal = original * ratio;
        return `${formatQuantity(newVal)} ${unit}`;
      });

      // Scale decimal/whole quantities
      scaled = scaled.replace(QTY_PATTERN, (match, num, unit) => {
        const idx = scaled.indexOf(match);
        const context = scaled.substring(Math.max(0, idx - 5), idx + match.length + 5);
        if (SKIP_PATTERNS.test(context)) return match;

        const original = parseFloat(num);
        const newVal = original * ratio;
        return `${formatQuantity(newVal)} ${unit}`;
      });

      // Scale embedded prices like "~$3.99"
      scaled = scaled.replace(PRICE_PATTERN, (match, price) => {
        const newPrice = (parseFloat(price) * ratio).toFixed(2);
        return `~$${newPrice}`;
      });

      el.textContent = scaled;
    });
  }, [ratio]);

  return (
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center">
        <span class="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Servings</span>
        <span class="text-primary font-bold text-lg">{scaledServings}</span>
      </div>
      <div class="flex gap-1.5 mt-1">
        {MULTIPLIERS.map((m, i) => (
          <button
            key={m}
            onClick={() => setRatio(m)}
            aria-label={`Scale to ${LABELS[i]}`}
            class={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
              ratio === m
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-highest text-on-surface hover:bg-outline-variant'
            }`}
          >
            {LABELS[i]}
          </button>
        ))}
      </div>
      {ratio !== 1 && (
        <div class="mt-2 text-xs text-on-surface-variant">
          Total: ~${totalCost.toFixed(2)} ({costDisplay})
        </div>
      )}
      {ratio !== 1 && (
        <div class="hidden print:block text-sm font-bold text-on-surface">
          Scaled to {LABELS[MULTIPLIERS.indexOf(ratio)]} ({scaledServings} servings)
        </div>
      )}
    </div>
  );
}
