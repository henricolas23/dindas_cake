import { $, escapeHtml, showToast } from '../utils.js';
import { api, json } from '../api.js';
import { editProfileDialog } from '../components/profile-dialog.js';

function renderProfiles(profiles, currentUser) {
  $('#profile-total').textContent = `${profiles.length} ${profiles.length === 1 ? 'perfil' : 'perfis'}`;
  $('#profile-rows').innerHTML = profiles.map((profile) => {
    const created = new Date(`${profile.created_at.replace(' ', 'T')}Z`).toLocaleDateString('pt-BR');
    const current = profile.id === currentUser.id;
    return `<tr><td><span class="profile-user"><span class="product-seal">${escapeHtml(profile.username.slice(0, 1).toUpperCase())}</span><span><b>${escapeHtml(profile.username)}</b>${current ? '<small>Seu perfil</small>' : ''}</span></span></td><td>${created}</td><td><span class="status-pill tone-${profile.active ? 'green' : 'neutral'}">${profile.active ? 'Ativo' : 'Acesso suspenso'}</span></td><td><div class="row-actions"><button class="small-action" data-profile="${profile.id}" aria-label="Editar perfil ${escapeHtml(profile.username)}" title="Editar perfil">✎</button></div></td></tr>`;
  }).join('');
}

export async function mountSettings(currentUser) {
  const [settings, initialProfiles] = await Promise.all([api('/settings'), api('/users')]);
  let profiles = initialProfiles;
  $('#low-limit').value = settings.lowStockLimit;
  renderProfiles(profiles, currentUser);

  $('#settings-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = Number($('#low-limit').value);
    try {
      await api('/settings', json('PUT', { lowStockLimit: value }));
      showToast('Configuração salva.');
    } catch (error) { showToast(error.message); }
  });

  $('#profile-rows').addEventListener('click', (event) => {
    const button = event.target.closest('[data-profile]');
    if (!button) return;
    const profile = profiles.find((item) => item.id === Number(button.dataset.profile));
    if (!profile) return;
    editProfileDialog(profile, currentUser, async (payload) => {
      const updated = await api(`/users/${profile.id}`, json('PUT', payload));
      profiles = updated;
      renderProfiles(updated, currentUser);
      if (profile.id === currentUser.id) $('.user-info b').textContent = payload.username;
      showToast('Perfil atualizado.');
    });
  });
}
