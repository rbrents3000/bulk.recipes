function getKey(recipeId: string): string {
  return `bulk-recipes-checked-${recipeId}`;
}

export function getChecked(recipeId: string): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(getKey(recipeId)) || '[]'));
  } catch {
    return new Set();
  }
}

export function setChecked(recipeId: string, indices: Set<number>): void {
  localStorage.setItem(getKey(recipeId), JSON.stringify([...indices]));
}
