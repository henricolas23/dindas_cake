import { $, escapeHtml } from '../utils.js';

const pages = {
  dashboard: { label: 'Visão geral', href: '/dashboard', icon: '⌂' },
  stock: { label: 'Estoque', href: '/estoque', icon: '▤' },
  history: { label: 'Movimentações', href: '/movimentacoes', icon: '◷' },
  settings: { label: 'Configurações', href: '/configuracoes', icon: '⚙' },
};

export function mountShell(activePage, username) {
  const content = $('#page-content');
  const item = pages[activePage] || pages.dashboard;
  const shell = document.createElement('div');
  shell.className = 'app-shell';
  shell.innerHTML = `
    <aside class="sidebar">
      <a class="brand-lockup" href="/dashboard"><span class="brand-flower">d</span><span>Dindas Cake<small>GESTÃO DE ESTOQUE</small></span></a>
      <span class="nav-caption">ESPAÇO DE TRABALHO</span>
      <nav class="side-nav" aria-label="Navegação principal">
        ${Object.entries(pages).map(([key, page]) => `<a class="side-link ${key === activePage ? 'is-active' : ''}" href="${page.href}" ${key === activePage ? 'aria-current="page"' : ''}><span class="side-icon">${page.icon}</span><span>${page.label}</span>${key === activePage ? '<i class="active-mark"></i>' : ''}</a>`).join('')}
      </nav>
      <div class="sidebar-note"><span>✿</span><p>Feito com cuidado,<br>do estoque à vitrine.</p></div>
      <div class="user-card"><span class="avatar">${escapeHtml(username.slice(0, 1).toUpperCase())}</span><span class="user-info"><b>${escapeHtml(username)}</b><small>Perfil da equipe</small></span><button id="logout" class="logout-button" aria-label="Sair da conta" title="Sair">↗</button></div>
    </aside>
    <div class="app-main"><header class="topbar"><div class="crumb"><span>DINDAS CAKE</span><b>/</b><strong>${item.label}</strong></div><div class="topbar-date"><span class="date-flower">✿</span><time id="today"></time></div></header></div>`;
  document.body.prepend(shell);
  $('.app-main').append(content);
  $('#today').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  $('#logout').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.assign('/');
  });
}
