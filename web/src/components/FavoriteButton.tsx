import { useState, useEffect, useRef } from 'preact/hooks';
import { isFavorite, toggleFavorite } from '../utils/favorites';

export default function FavoriteButton({ recipeId }: { recipeId: string }) {
  const [fav, setFav] = useState(() => isFavorite(recipeId));
  const [burst, setBurst] = useState(false);
  const isFirst = useRef(true);

  const handleClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setFav(toggleFavorite(recipeId));
  };

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (fav) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 400);
      return () => clearTimeout(t);
    }
  }, [fav]);

  return (
    <button
      onClick={handleClick}
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={fav}
      class={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all z-10 ${burst ? 'heart-burst' : ''}`}
    >
      <span
        class={`material-symbols-outlined text-lg transition-all duration-200 ${fav ? 'text-primary scale-110' : 'text-neutral-400 scale-100'}`}
        style={fav ? 'font-variation-settings: "FILL" 1' : ''}
      >
        favorite
      </span>
    </button>
  );
}
