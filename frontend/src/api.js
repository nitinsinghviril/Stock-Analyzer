// In development Vite proxies /api to the backend. In production set
// VITE_API_URL to the backend origin, e.g. https://stock-analyzer-api.onrender.com
const BASE = import.meta.env.VITE_API_URL || "";

async function request(path) {
  const response = await fetch(`${BASE}${path}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return body;
}

export const analyze = (ticker) => request(`/api/analyze/${encodeURIComponent(ticker)}`);
export const competitors = (ticker) => request(`/api/competitors/${encodeURIComponent(ticker)}`);
export const chart = (ticker, period = "1y") =>
  request(`/api/chart/${encodeURIComponent(ticker)}?period=${period}`);
