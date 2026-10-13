export const apiBase = (import.meta.env.VITE_ANALYTICS_API_URL || '').replace(/\/$/, '');
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { ...init, credentials: 'include', headers: { ...(init.headers || {}) } });
  if (!response.ok) {
    if (response.status === 401) { const e = new Error('Sessão expirada. Entre novamente.'); e.name = 'AuthError'; throw e; }
    throw new Error(response.status === 429 ? 'Muitas tentativas. Aguarde e tente novamente.' : 'Não foi possível atualizar os dados.');
  }
  return response.json() as Promise<T>;
}
