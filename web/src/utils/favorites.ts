const KEY = 'bulk-recipes-favorites';

export function getFavorites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const isFav = favs.has(id);
  if (isFav) favs.delete(id);
  else favs.add(id);
  localStorage.setItem(KEY, JSON.stringify([...favs]));
  return !isFav;
}

export function isFavorite(id: string): boolean {
  return getFavorites().has(id);
}
