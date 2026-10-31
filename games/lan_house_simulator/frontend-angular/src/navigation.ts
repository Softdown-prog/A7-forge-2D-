/**
 * Angular presentation routes through the existing DOM controller.
 * All business rules, availability and year restrictions remain in TypeScript.
 */
export function navigateToArea(area: string, page?: string): string | null {
  const admin = document.getElementById('admin');
  if (!admin) return 'Painel administrativo indisponível.';
  if (admin.hidden) document.getElementById('open-admin')?.click();
  const tab = admin.querySelector<HTMLButtonElement>('[data-admin-tab="' + area + '"]');
  if (!tab) return 'Seção indisponível.';
  tab.click();
  if (!page) return null;
  const task = admin.querySelector<HTMLButtonElement>(
    '#section-' + area + ' .management-pages [data-panel-choice="' + page + '"]'
  );
  if (!task) return 'Página indisponível.';
  if (task.disabled) {
    admin.querySelector<HTMLButtonElement>('#section-stock [data-panel-choice="suppliers"]')?.click();
    return 'Catálogo avançado disponível em 2000. Mostrando fornecedores.';
  }
  task.click();
  return null;
}
