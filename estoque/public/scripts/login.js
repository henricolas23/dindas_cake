import { api } from './api.js';
import { $ } from './utils.js';

async function checkSession() {
  try {
    const { user } = await api('/session');
    if (user) window.location.replace('/dashboard');
  } catch { /* O formulário continua disponível para nova tentativa. */ }
}

$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const error = $('#login-error');
  error.textContent = '';
  button.disabled = true;
  button.querySelector('span').textContent = '…';
  try {
    const credentials = Object.fromEntries(new FormData(form));
    await api('/login', { method: 'POST', body: JSON.stringify(credentials) });
    window.location.assign('/dashboard');
  } catch (exception) {
    error.textContent = exception.message;
    button.disabled = false;
    button.querySelector('span').textContent = '→';
  }
});

checkSession();
