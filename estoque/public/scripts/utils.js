export const $ = (selector, scope = document) => scope.querySelector(selector);
export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function formatDate(value) {
  return new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('pt-BR', {
    dateStyle: 'short', timeStyle: 'short',
  });
}

export function getProductStatus(product, limit) {
  if (!product.active) return { label: 'Inativo', tone: 'neutral' };
  if (product.quantity === 0) return { label: 'Sem estoque', tone: 'rose' };
  if (product.quantity <= limit) return { label: 'Estoque baixo', tone: 'gold' };
  return { label: 'Disponível', tone: 'green' };
}

export function showToast(message) {
  let toast = $('#app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast'; toast.className = 'toast'; toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('toast-visible'), 2800);
}
