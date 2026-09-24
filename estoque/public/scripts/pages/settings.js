import { $, showToast } from '../utils.js';
import { api, json } from '../api.js';

export async function mountSettings() {
  const settings = await api('/settings');
  $('#low-limit').value = settings.lowStockLimit;
  $('#settings-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = Number($('#low-limit').value);
    try {
      await api('/settings', json('PUT', { lowStockLimit: value }));
      showToast('Configuração salva.');
    } catch (error) { showToast(error.message); }
  });
}
