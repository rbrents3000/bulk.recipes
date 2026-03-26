import { useState } from 'preact/hooks';

interface Props {
  foodCourt: string;
  deli: string;
  bakery: string | null;
}

const tabs = [
  { key: 'food-court', label: 'Food Court', icon: 'fastfood' },
  { key: 'deli', label: 'Deli', icon: 'flatware' },
  { key: 'bakery', label: 'Bakery', icon: 'bakery_dining' },
];

export default function CountryTabs({ foodCourt, deli, bakery }: Props) {
  const [active, setActive] = useState('food-court');

  const availableTabs = tabs.filter(t => {
    if (t.key === 'bakery' && !bakery) return false;
    return true;
  });

  const content: Record<string, string> = {
    'food-court': foodCourt,
    'deli': deli,
    'bakery': bakery || '',
  };

  return (
    <div>
      {/* Tab buttons */}
      <div class="flex justify-center gap-3 mb-10">
        {availableTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            class={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${
              active === tab.key
                ? 'bg-primary text-white shadow-lg scale-105'
                : 'bg-surface-container-highest text-on-surface-variant hover:scale-105'
            }`}
          >
            <span class="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        class="prepared-content prose prose-lg max-w-none
          prose-headings:font-headline prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4
          prose-h3:text-xl prose-h3:font-bold
          prose-p:text-on-surface-variant prose-p:leading-relaxed
          prose-li:text-on-surface-variant
          prose-strong:text-on-surface
          prose-blockquote:bg-primary-container/10 prose-blockquote:border-l-4 prose-blockquote:border-primary-container prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:not-italic
        "
        dangerouslySetInnerHTML={{ __html: content[active] }}
      />
    </div>
  );
}
