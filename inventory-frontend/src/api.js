// REST API client connected to the Express + SQLite backend

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body?.error?.message || `Request failed (${res.status})`);
  }
  return body;
}

export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  const qs = query.toString();
  const body = await request(`/api/products${qs ? `?${qs}` : ''}`);
  return body.data;
}

export async function createProduct(data) {
  const body = await request('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return body.data;
}

export async function updateProduct(id, data) {
  const body = await request(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      category: data.category,
      unitPrice: data.unitPrice,
      minStockLevel: data.minStockLevel,
    }),
  });
  return body.data;
}

export async function deleteProduct(id) {
  return request(`/api/products/${id}`, { method: 'DELETE' });
}

export async function adjustStock(payload) {
  const body = await request('/api/inventory/movement', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return body.data;
}

export async function fetchReportSummary() {
  const body = await request('/api/reports/summary');
  return body.data;
}

export async function fetchLowStock() {
  const body = await request('/api/reports/low-stock');
  return body.data;
}

export async function fetchTransactions(limit = 8) {
  const body = await request(`/api/reports/transactions?limit=${limit}`);
  return body.data;
}
