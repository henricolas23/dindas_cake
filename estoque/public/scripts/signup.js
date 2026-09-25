import { api } from './api.js';
import { $ } from './utils.js';

async function checkSession() {
  try {
    const { user } = await api('/session');
    if (user) window.location.replace('/dashboard');
  } catch { /* O formulário continua disponível para nova tentativa. */ }
}

$('#signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const error = $('#signup-error');
  const button = form.querySelector('button[type="submit"]');
  error.textContent = '';
  if (form.elements.password.value !== form.elements.confirmPassword.value) {
    error.textContent = 'As senhas não coincidem.';
    return;
  }

  button.disabled = true;
  try {
    const account = {
      username: form.elements.username.value,
      email: form.elements.email.value,
      password: form.elements.password.value,
    };
    await api('/register', { method: 'POST', body: JSON.stringify(account) });
    window.location.assign('/dashboard');
  } catch (exception) {
    error.textContent = exception.message;
    button.disabled = false;
  }
});

checkSession();
