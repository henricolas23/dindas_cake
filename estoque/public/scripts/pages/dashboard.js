import { $, escapeHtml, getProductStatus } from '../utils.js';

const colors = ['#c85678', '#e49b77', '#a995bb', '#8aa396', '#d5b45f', '#8eacc0', '#da8291', '#8d756d'];

export function renderDashboard(products, lowLimit) {
  const active = products.filter((product) => product.active);
  const total = active.reduce((sum, product) => sum + product.quantity, 0);
  const byQuantity = [...active].sort((a, b) => a.quantity - b.quantity);
  const min = byQuantity[0]; const max = byQuantity.at(-1);
  $('#total-products').textContent = active.length;
  $('#total-units').textContent = total;
  $('#max-product').textContent = max?.name || '—';
  $('#max-units').textContent = max ? `${max.quantity} ${max.quantity === 1 ? 'unidade' : 'unidades'}` : 'Sem produtos';
  $('#min-product').textContent = min?.name || '—';
  $('#min-units').textContent = min ? `${min.quantity} ${min.quantity === 1 ? 'unidade' : 'unidades'}` : 'Sem produtos';

  const bars = [...active].sort((a, b) => b.quantity - a.quantity);
  $('#bars').innerHTML = bars.length ? bars.map((product, index) => `<div class="bar-row"><div class="bar-meta"><span title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</span><b>${product.quantity}</b></div><div class="bar-track"><i style="width:${bars[0].quantity ? product.quantity / bars[0].quantity * 100 : 0}%;--bar-color:${colors[index % colors.length]}"></i></div></div>`).join('') : '<div class="empty-chart"><span>✿</span><p>Seus produtos vão aparecer aqui assim que você cadastrar o primeiro.</p><a href="/estoque">Adicionar produto →</a></div>';

  let cursor = 0;
  const segments = active.map((product, index) => {
    const start = cursor; cursor += total ? product.quantity / total * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  const shareGradient = total ? segments.join(',') : '#f2e9e8 0%, #f2e9e8 100%';
  $('#shares').innerHTML = active.length ? `<div class="share-visual"><div class="share-ring" style="--share-colors:${shareGradient}"><div><b>${total}</b><span>unidades</span></div></div><div class="share-legend">${active.map((product, index) => `<div><i style="--legend-color:${colors[index % colors.length]}"></i><span title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</span><b>${total ? (product.quantity / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'}%</b></div>`).join('')}</div></div>` : '<div class="empty-chart"><span>◌</span><p>Quando houver estoque cadastrado, você verá a participação de cada produto.</p></div>';

  const low = active.filter((product) => product.quantity <= lowLimit).sort((a, b) => a.quantity - b.quantity);
  $('#low-list').innerHTML = low.length ? low.slice(0, 5).map((product) => {
    const badge = getProductStatus(product, lowLimit);
    return `<a class="attention-item" href="/estoque"><span class="attention-symbol">${product.quantity === 0 ? '!' : '↘'}</span><span class="attention-name"><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.category || 'Sem categoria')}</small></span><span class="status-pill tone-${badge.tone}">${badge.label}</span><b class="attention-count">${product.quantity}</b></a>`;
  }).join('') : '<div class="all-good"><span>✓</span><p>Tudo em ordem. Nenhum produto precisa de reposição.</p></div>';
}
