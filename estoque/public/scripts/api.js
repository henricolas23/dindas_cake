export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  let data = {};
  try { data = await response.json(); } catch { /* Resposta sem corpo JSON. */ }
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.');
  return data;
}

export const json = (method, body) => ({ method, body: JSON.stringify(body) });
