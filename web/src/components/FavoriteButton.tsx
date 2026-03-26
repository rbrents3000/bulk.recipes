import { useState, useEffect, useRef } from 'preact/hooks';
import { isFavorite, toggleFavorite } from '../utils/favorites';

export default function FavoriteButton({ recipeId }: { recipeId: string }) {
  const [fav, setFav] = useState(() => isFavorite(recipeId));
  const [pulse, setPulse] = useState(false);
  const isFirst = useRef(true);

  const handleClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setFav(toggleFavorite(recipeId));
  };

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 300);
    return () => clearTimeout(t);
  }, [fav]);

  return (
    <button
      onClick={handleClick}
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={fav}
      class={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all z-10 ${pulse ? 'scale-125' : ''}`}
    >
      <span
        class={`material-symbols-outlined text-lg transition-colors ${fav ? 'text-primary' : 'text-neutral-400'}`}
        style={fav ? 'font-variation-settings: "FILL" 1' : ''}
      >
        favorite
      </span>
    </button>
  );
}
