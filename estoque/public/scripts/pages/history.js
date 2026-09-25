import { $, escapeHtml, formatDate, showToast } from '../utils.js';
import { api } from '../api.js';

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(date, offset) {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}

function sqlBoundary(date, nextDay = false) {
  const boundary = new Date(`${date}T00:00:00`);
  if (nextDay) boundary.setDate(boundary.getDate() + 1);
  return boundary.toISOString().slice(0, 19).replace('T', ' ');
}

function renderRows(movements, caption) {
  $('#movement-rows').innerHTML = movements.map((movement) => {
    const entry = movement.type === 'entrada';
    const adjustment = movement.type === 'ajuste';
    const label = entry ? 'Entrada' : adjustment ? 'Ajuste' : 'Saída';
    return `<tr><td>${formatDate(movement.created_at)}</td><td><b>${escapeHtml(movement.product_name)}</b></td><td><span class="status-pill tone-${entry ? 'green' : adjustment ? 'neutral' : 'gold'}">${label}</span></td><td><b class="movement-quantity ${entry ? 'is-entry' : 'is-exit'}">${entry ? '+' : '−'}${movement.quantity}</b></td><td>${escapeHtml(movement.username || '—')}</td></tr>`;
  }).join('');
  $('#movement-count').textContent = `${movements.length} ${movements.length === 1 ? 'movimentação' : 'movimentações'} · ${caption}`;
  $('.table-scroll').classList.toggle('hidden', movements.length === 0);
  $('#empty-history').classList.toggle('hidden', movements.length > 0);
}

export async function mountHistory() {
  const filter = $('#period-filter');
  const customRange = $('#custom-range');
  const today = new Date();
  $('#date-to').value = localDate(today);
  $('#date-from').value = localDate(shiftDate(today, -6));

  async function load(from, to, caption) {
    try {
      const query = from && to
        ? `?${new URLSearchParams({ from: sqlBoundary(from), to: sqlBoundary(to, true) })}`
        : '';
      renderRows(await api(`/movements${query}`), caption);
    } catch (error) { showToast(error.message); }
  }

  filter.addEventListener('change', () => {
    const value = filter.value;
    customRange.classList.toggle('hidden', value !== 'custom');
    if (value === 'custom') return;

    const now = new Date();
    if (value === 'all') return load(null, null, 'todo o período');
    if (value === 'today') {
      const date = localDate(now);
      return load(date, date, 'hoje');
    }
    if (value === 'yesterday') {
      const date = localDate(shiftDate(now, -1));
      return load(date, date, 'ontem');
    }

    const days = Number(value);
    const from = localDate(shiftDate(now, 1 - days));
    const to = localDate(now);
    return load(from, to, `últimos ${days} dias`);
  });

  $('#apply-range').addEventListener('click', () => {
    const from = $('#date-from').value;
    const to = $('#date-to').value;
    if (!from || !to || from > to) {
      showToast('Escolha uma data inicial e final válidas.');
      return;
    }
    return load(from, to, `${new Date(`${from}T00:00:00`).toLocaleDateString('pt-BR')} a ${new Date(`${to}T00:00:00`).toLocaleDateString('pt-BR')}`);
  });

  await load(null, null, 'todo o período');
}
