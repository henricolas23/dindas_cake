import { $, escapeHtml, formatDate } from '../utils.js';

export function renderHistory(movements) {
  $('#movement-rows').innerHTML = movements.map((movement) => {
    const entry = movement.type === 'entrada';
    const adjustment = movement.type === 'ajuste';
    const label = entry ? 'Entrada' : adjustment ? 'Ajuste' : 'Saída';
    return `<tr><td>${formatDate(movement.created_at)}</td><td><b>${escapeHtml(movement.product_name)}</b></td><td><span class="status-pill tone-${entry ? 'green' : adjustment ? 'neutral' : 'gold'}">${label}</span></td><td><b class="movement-quantity ${entry ? 'is-entry' : 'is-exit'}">${entry ? '+' : '−'}${movement.quantity}</b></td><td>${escapeHtml(movement.username || '—')}</td></tr>`;
  }).join('');
  $('.table-scroll').classList.toggle('hidden', movements.length === 0);
  $('#empty-history').classList.toggle('hidden', movements.length > 0);
}
