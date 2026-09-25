import { api, json } from './api.js';
import { $, showToast } from './utils.js';
import { mountShell } from './components/shell.js';
import { productDialog, movementDialog } from './components/dialogs.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderStock } from './pages/stock.js';
import { mountHistory } from './pages/history.js';
import { mountSettings } from './pages/settings.js';

const page = document.body.dataset.page;
let products = [];
let lowLimit = 5;

async function loadProducts() {
  [products, lowLimit] = await Promise.all([
    api('/products'), api('/settings').then((settings) => settings.lowStockLimit),
  ]);
  if (page === 'dashboard') renderDashboard(products, lowLimit);
  if (page === 'stock') renderStock(products, lowLimit);
}

async function saveProduct(product, id = '') {
  await api(id ? `/products/${id}` : '/products', json(id ? 'PUT' : 'POST', product));
  await loadProducts();
  showToast(id ? 'Produto atualizado.' : 'Produto cadastrado.');
}

async function start() {
  try {
    const session = await api('/session');
    if (!session.user) return window.location.replace('/entrar');
    mountShell(page, session.user.username);

    if (page === 'dashboard' || page === 'stock') await loadProducts();
    if (page === 'history') await mountHistory();
    if (page === 'settings') await mountSettings(session.user);

    $('#add-product')?.addEventListener('click', () => productDialog(null, (product) => saveProduct(product)));
    $('#empty-add')?.addEventListener('click', () => productDialog(null, (product) => saveProduct(product)));
    $('#search')?.addEventListener('input', () => renderStock(products, lowLimit));
    $('#sort')?.addEventListener('change', () => renderStock(products, lowLimit));

    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-edit], [data-move], [data-delete]');
      if (!button) return;
      const id = Number(button.dataset.edit || button.dataset.move || button.dataset.delete);
      const product = products.find((item) => item.id === id);
      if (!product) return;
      if (button.dataset.edit) productDialog(product, (payload) => saveProduct(payload, id));
      if (button.dataset.move) movementDialog(product, async (payload) => {
        await api(`/movements/${id}`, json('POST', payload));
        await loadProducts(); showToast('Estoque atualizado.');
      });
      if (button.dataset.delete && window.confirm(`Deseja mesmo excluir “${product.name}”?`)) {
        try {
          await api(`/products/${id}`, { method: 'DELETE' });
          await loadProducts(); showToast('Produto excluído.');
        } catch (error) { showToast(error.message); }
      }
    });
  } catch (error) {
    if (error.message.includes('login')) window.location.replace('/entrar');
    else { console.error(error); showToast('Não foi possível carregar esta página. Atualize e tente novamente.'); }
  }
}

start();
