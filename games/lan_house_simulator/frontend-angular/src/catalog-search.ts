/** Pure accent-insensitive matching; never purchases or changes game state. */
export function normalizeCatalogSearch(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
}
export function catalogSearchText(parts: readonly string[]): string {
  return normalizeCatalogSearch(parts.join(' '));
}
export function catalogSearchMatch(query: string, parts: string[]): boolean {
  const wanted = normalizeCatalogSearch(query);
  return !wanted || catalogSearchText(parts).includes(wanted);
}
