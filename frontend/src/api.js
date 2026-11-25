const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Please try again.'), { errors: {} });
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Something went wrong'), { errors: data.errors || {} });
  return data;
}

export const api = {
  options: () => request('/api/options'),
  list: (filters) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
    return request('/api/patients?' + q);
  },
  create: (body) => request('/api/patients', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  discharge: (id) => request(`/api/patients/${id}/discharge`, { method: 'PATCH' }),
  remove: (id) => request(`/api/patients/${id}`, { method: 'DELETE' }),
};
