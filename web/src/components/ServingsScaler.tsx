import { useState, useEffect, useRef, useCallback } from 'preact/hooks';

interface Props {
  baseServings: number;
  baseCost: number;
  costUnit: string;
}

// Numbers we should NOT scale (temperatures, sizes, item numbers)
const SKIP_PATTERNS = /(\d+)\s*°[FC]|(\d+)-inch|(\d+)-minute|(\d+)-hour|#\d+|Item\s*#/i;

// Quantity patterns we SHOULD scale
const QTY_PATTERN = /(\d+\.?\d*)\s*(lbs?|pounds?|oz|ounces?|cups?|tbsp|tsp|tablespoons?|teaspoons?|cloves?|sprigs?|slices?|pieces?|strips?|fillets?|pack|bags?|cans?|jars?|bottles?|g\b|grams?|kg)/gi;

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

const MULTIPLIERS = [0.5, 1, 2, 3, 4];
const LABELS = ['½×', '1×', '2×', '3×', '4×'];

export default function ServingsScaler({ baseServings, baseCost, costUnit }: Props) {
  const [ratio, setRatio] = useState(1);
  const [pop, setPop] = useState(false);
  const originals = useRef<{ el: HTMLElement; text: string }[]>([]);
  const initialized = useRef(false);
  const isFirstRender = useRef(true);

  // Trigger pop animation on ratio change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPop(true);
    const t = setTimeout(() => setPop(false), 250);
    return () => clearTimeout(t);
  }, [ratio]);

  const scaledServings = Math.round(baseServings * ratio);
  // For per-serving pricing, total = cost * scaled servings.
  // For batch/other pricing, total = cost * ratio (scaling the batch).
  const totalCost = costUnit === 'serving'
    ? baseCost * scaledServings
    : baseCost * ratio;
  const costDisplay = costUnit === 'serving'
    ? `$${baseCost.toFixed(2)}/serving`
    : `$${baseCost.toFixed(2)}/${costUnit}`;

  useEffect(() => {
    // This component reaches into Astro-rendered DOM to scale ingredient
    // quantities. This cross-island DOM manipulation is fragile by nature but is
    // the pragmatic trade-off for keeping ingredients server-rendered (SEO, no-JS
    // fallback) while allowing client-side scaling. If the selectors below stop
    // matching, the scaler simply won't scale — it won't crash.
    if (initialized.current) return;
    initialized.current = true;

    const costcoSpans = document.querySelectorAll('[data-scalable="costco"] .ingredient-text');
    const otherSpans = document.querySelectorAll('[data-scalable="other"] > span');

    costcoSpans.forEach(el => {
      if (el?.textContent != null) {
        originals.current.push({ el: el as HTMLElement, text: el.textContent });
      }
    });
    otherSpans.forEach(el => {
      if (el?.textContent != null) {
        originals.current.push({ el: el as HTMLElement, text: el.textContent });
      }
    });
  }, []);

  useEffect(() => {
    if (!initialized.current || originals.current.length === 0) return;

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

      el.textContent = scaled;
    });
  }, [ratio]);

  return (
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center">
        <span class="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Servings</span>
        <span class={`text-primary font-bold text-lg ${pop ? 'animate-pop' : ''}`}>{scaledServings}</span>
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
      <div class="flex items-center gap-2 mt-1.5">
        <label class="text-xs text-on-surface-variant font-medium" for="custom-multiplier">Custom (0.25–10):</label>
        <input
          id="custom-multiplier"
          type="number"
          min="0.25"
          max="10"
          step="0.25"
          value={ratio}
          onInput={(e) => {
            const raw = parseFloat((e.target as HTMLInputElement).value);
            if (!isNaN(raw) && raw > 0) setRatio(Math.min(Math.max(raw, 0.25), 10));
          }}
          class="w-16 h-8 text-center text-sm font-bold bg-surface-container-highest rounded-lg border-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {ratio !== 1 && (
        <div class="mt-2 text-xs text-on-surface-variant">
          {costUnit === 'serving'
            ? `Total: ~$${totalCost.toFixed(2)} (${scaledServings} servings × ${costDisplay})`
            : `Total: ~$${totalCost.toFixed(2)} (${ratio}× ${costDisplay})`
          }
        </div>
      )}
      {ratio !== 1 && (
        <div class="hidden print:block text-sm font-bold text-on-surface">
          Scaled to {LABELS[MULTIPLIERS.indexOf(ratio)] || `${ratio}×`} ({scaledServings} servings)
        </div>
      )}
    </div>
  );
}
