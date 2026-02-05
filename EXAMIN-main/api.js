// Simple API wrapper to avoid repeating fetch boilerplate
// Uses bearer token when provided via options.auth

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function buildHeaders(token, extra) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (extra) Object.entries(extra).forEach(([k, v]) => headers.set(k, String(v)));
  return headers;
}

async function request(method, path, body, { auth: token, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const message = (data && data.error) || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export default {
  get: (p, opts) => request('GET', p, undefined, opts),
  post: (p, b, opts) => request('POST', p, b, opts),
  put: (p, b, opts) => request('PUT', p, b, opts),
  patch: (p, b, opts) => request('PATCH', p, b, opts),
  delete: (p, opts) => request('DELETE', p, undefined, opts),
  // Multipart upload helper: do NOT set JSON content-type
  upload: async (path, file, { auth: token, folder } = {}) => {
    const form = new FormData();
    form.append('file', file);
    const url = folder ? `${path}?folder=${encodeURIComponent(folder)}` : path;
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: (() => {
        const h = new Headers();
        if (token) h.set('Authorization', `Bearer ${token}`);
        return h;
      })(),
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Upload failed');
    return data; // { url, public_id, ... }
  },
};
