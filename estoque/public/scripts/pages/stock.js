import { $, escapeHtml, getProductStatus } from '../utils.js';

export function renderStock(products, lowLimit) {
  const query = $('#search').value.trim().toLocaleLowerCase('pt-BR');
  const sort = $('#sort').value;
  const visible = products.filter((product) => `${product.name} ${product.category || ''}`.toLocaleLowerCase('pt-BR').includes(query));
  visible.sort(sort === 'quantity-desc' ? (a, b) => b.quantity - a.quantity : sort === 'quantity-asc' ? (a, b) => a.quantity - b.quantity : (a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  $('#product-rows').innerHTML = visible.map((product) => {
    const badge = getProductStatus(product, lowLimit);
    return `<tr><td><span class="product-cell"><span class="product-seal">${escapeHtml(product.name.slice(0, 1).toUpperCase())}</span><span><b>${escapeHtml(product.name)}</b>${product.description ? `<small>${escapeHtml(product.description)}</small>` : ''}</span></span></td><td>${escapeHtml(product.category || '—')}</td><td><b class="quantity-cell">${product.quantity}</b> <span class="table-unit">un.</span></td><td><span class="status-pill tone-${badge.tone}">${badge.label}</span></td><td><div class="row-actions"><button class="small-action" data-move="${product.id}" title="Entrada ou saída" aria-label="Movimentar ${escapeHtml(product.name)}">±</button><button class="small-action" data-edit="${product.id}" title="Editar" aria-label="Editar ${escapeHtml(product.name)}">✎</button><button class="small-action action-delete" data-delete="${product.id}" title="Excluir" aria-label="Excluir ${escapeHtml(product.name)}">×</button></div></td></tr>`;
  }).join('');
  $('#empty-stock').classList.toggle('hidden', visible.length > 0);
  $('.table-scroll').classList.toggle('hidden', visible.length === 0);
}
