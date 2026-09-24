import { escapeHtml } from '../utils.js';

function createDialog(markup) {
  const dialog = document.createElement('dialog');
  dialog.className = 'app-dialog'; dialog.innerHTML = markup;
  document.body.append(dialog);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
  return dialog;
}

export function productDialog(product, onSave) {
  const dialog = createDialog(`<form class="dialog-form"><div class="dialog-top"><div><span class="eyebrow">${product ? 'ATUALIZE OS DETALHES' : 'UM NOVO PRODUTO'}</span><h2>${product ? 'Editar produto' : 'Adicionar produto'}</h2></div><button type="button" class="dialog-close" data-close aria-label="Fechar">×</button></div>
    <label>Nome do produto<input name="name" maxlength="100" required value="${escapeHtml(product?.name || '')}" placeholder="Como você chama esse produto?"></label>
    <div class="form-two"><label>Quantidade<input name="quantity" type="number" min="0" step="1" required value="${product?.quantity ?? 0}"></label><label>Categoria <span class="optional">opcional</span><input name="category" maxlength="80" value="${escapeHtml(product?.category || '')}" placeholder="Ex.: bolos"></label></div>
    <label>Descrição <span class="optional">opcional</span><textarea name="description" rows="3" maxlength="500" placeholder="Uma nota para sua equipe">${escapeHtml(product?.description || '')}</textarea></label>
    <label class="checkbox-line"><input name="active" type="checkbox" ${!product || product.active ? 'checked' : ''}> Produto ativo</label><p class="dialog-error" role="alert"></p>
    <div class="dialog-actions"><button type="button" class="button button-quiet" data-close>Cancelar</button><button class="button button-primary">Salvar produto <span>→</span></button></div></form>`);
  dialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    payload.quantity = Number(payload.quantity); payload.active = form.elements.active.checked;
    try { await onSave(payload); dialog.close(); } catch (error) { dialog.querySelector('.dialog-error').textContent = error.message; }
  });
  dialog.showModal();
}

export function movementDialog(product, onSave) {
  const dialog = createDialog(`<form class="dialog-form"><div class="dialog-top"><div><span class="eyebrow">MOVIMENTAÇÃO DE ESTOQUE</span><h2>${escapeHtml(product.name)}</h2><p class="dialog-subtitle">Disponível agora: <b>${product.quantity} ${product.quantity === 1 ? 'unidade' : 'unidades'}</b></p></div><button type="button" class="dialog-close" data-close aria-label="Fechar">×</button></div>
    <label>Tipo de movimentação<select name="type"><option value="entrada">Entrada de produtos</option><option value="saida">Saída de produtos</option></select></label><label>Quantidade<input name="quantity" type="number" min="1" step="1" required placeholder="0"></label><p class="dialog-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button button-quiet" data-close>Cancelar</button><button class="button button-primary">Atualizar estoque <span>→</span></button></div></form>`);
  dialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget;
    try { await onSave({ type: form.elements.type.value, quantity: Number(form.elements.quantity.value) }); dialog.close(); }
    catch (error) { dialog.querySelector('.dialog-error').textContent = error.message; }
  });
  dialog.showModal();
}
