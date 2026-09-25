import { escapeHtml } from '../utils.js';

export function editProfileDialog(profile, currentUser, onSave) {
  const isCurrentUser = profile.id === currentUser.id;
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog';
  dialog.innerHTML = `<form class="dialog-form"><div class="dialog-top"><div><span class="eyebrow">PERFIL DA EQUIPE</span><h2>Editar acesso</h2></div><button type="button" class="dialog-close" data-close aria-label="Fechar">×</button></div>
    <label>Nome de usuário<input name="username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9._-]+" value="${escapeHtml(profile.username)}"></label>
    <label>E-mail de recuperação<input name="email" type="email" maxlength="254" autocomplete="email" placeholder="voce@exemplo.com" value="${escapeHtml(profile.email || '')}"></label>
    <label>Nova senha <span class="optional">deixe em branco para manter a atual</span><input name="password" type="password" minlength="8" autocomplete="new-password" placeholder="Pelo menos 8 caracteres"></label>
    <label class="checkbox-line"><input name="active" type="checkbox" ${profile.active ? 'checked' : ''} ${isCurrentUser ? 'disabled' : ''}> Acesso ativo</label>
    ${isCurrentUser ? '<p class="profile-hint">Seu próprio acesso não pode ser suspenso por esta tela.</p>' : ''}
    <p class="dialog-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button button-quiet" data-close>Cancelar</button><button class="button button-primary">Salvar perfil <span>→</span></button></div></form>`;
  document.body.append(dialog);
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onSave({
        username: form.elements.username.value,
        email: form.elements.email.value,
        password: form.elements.password.value,
        active: isCurrentUser ? profile.active === 1 : form.elements.active.checked,
      });
      dialog.close();
    } catch (error) { dialog.querySelector('.dialog-error').textContent = error.message; }
  });
  dialog.showModal();
}
