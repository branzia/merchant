import * as SecureStore from 'expo-secure-store';
import { api, app } from '@/config';

const BASE_URL = api.baseUrl;
const TOKEN_KEY = app.storageKeys.token;

// ─── Token helpers ────────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(MERCHANT_KEY);
  _cache.clear();
}

const MERCHANT_KEY = app.storageKeys.merchant;

export async function getCachedMerchant(): Promise<Record<string, any> | null> {
  try {
    const raw = await SecureStore.getItemAsync(MERCHANT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveMerchant(merchant: Record<string, any>): Promise<void> {
  try {
    await SecureStore.setItemAsync(MERCHANT_KEY, JSON.stringify(merchant));
  } catch {
    // non-critical — silent fail
  }
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
//
// Keyed by a string (e.g. "dashboard", "categories", "products?page=1").
// TTL is in milliseconds. Infinity = cached until explicitly invalidated.

const _cache = new Map<string, { data: any; ts: number }>();

async function getCached(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<{ status: number; data: any }>,
): Promise<{ status: number; data: any }> {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return { status: 200, data: hit.data };
  }
  const res = await fetcher();
  if (res.status === 200) {
    _cache.set(key, { data: res.data, ts: Date.now() });
  }
  return res;
}

// Delete every cache entry whose key starts with `prefix`.
function invalidate(prefix: string) {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  isFormData = false,
): Promise<{ status: number; data: any }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body
      ? isFormData
        ? (body as unknown as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = (login: string, password: string) =>
  request('POST', '/auth/login', { login, password } as any);

export const logout = () => request('POST', '/auth/logout');

export const getMe = () => request('GET', '/auth/me');

// ─── Dashboard  (30 s TTL) ────────────────────────────────────────────────────

export const getDashboard = () =>
  getCached('dashboard', 30_000, () => request('GET', '/dashboard'));

// ─── Orders  (never cached — must be real-time) ───────────────────────────────

export const getOrders = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request('GET', `/orders${qs}`);
};

export const getOrder = (id: number) => request('GET', `/orders/${id}`);

export const updateOrderStatus = (
  id: number,
  status: string,
  rejectReason?: string,
) =>
  request('PATCH', `/orders/${id}/status`, {
    status,
    ...(rejectReason ? { reject_reason: rejectReason } : {}),
  } as any);

// ─── Products  (60 s TTL per query, invalidated on any mutation) ──────────────

export const getProducts = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return getCached(`products${qs}`, 60_000, () => request('GET', `/products${qs}`));
};

export const getProduct = (id: number) => request('GET', `/products/${id}`);

export const deleteProduct = async (id: number) => {
  const res = await request('DELETE', `/products/${id}`);
  if (res.status === 200) invalidate('products');
  return res;
};

export const toggleProduct = async (id: number) => {
  const res = await request('PATCH', `/products/${id}/toggle`);
  if (res.status === 200) invalidate('products');
  return res;
};

export async function createProduct(formData: FormData) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (res.status === 201) invalidate('products');
  return { status: res.status, data };
}

export async function updateProduct(id: number, formData: FormData) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (res.status === 200) invalidate('products');
  return { status: res.status, data };
}

// ─── Categories  (cached until mutated) ──────────────────────────────────────

export const getCategories = () =>
  getCached('categories', Infinity, () => request('GET', '/categories'));

export const createCategory = async (data: Record<string, unknown>) => {
  const res = await request('POST', '/categories', data);
  if (res.status === 201) invalidate('categories');
  return res;
};

export const updateCategory = async (id: number, data: Record<string, unknown>) => {
  const res = await request('PUT', `/categories/${id}`, data);
  if (res.status === 200) invalidate('categories');
  return res;
};

export const deleteCategory = async (id: number) => {
  const res = await request('DELETE', `/categories/${id}`);
  if (res.status === 200) invalidate('categories');
  return res;
};

// ─── Attributes  (cached until mutated) ──────────────────────────────────────

export const getAttributes = () =>
  getCached('attributes', Infinity, () => request('GET', '/attributes'));

export const createAttribute = async (data: Record<string, unknown>) => {
  const res = await request('POST', '/attributes', data);
  if (res.status === 201) invalidate('attributes');
  return res;
};

export const updateAttribute = async (id: number, data: Record<string, unknown>) => {
  const res = await request('PUT', `/attributes/${id}`, data);
  if (res.status === 200) invalidate('attributes');
  return res;
};

export const deleteAttribute = async (id: number) => {
  const res = await request('DELETE', `/attributes/${id}`);
  if (res.status === 200) invalidate('attributes');
  return res;
};

// ─── Payment Methods  (2 min TTL, invalidated on any update) ─────────────────

export const getPaymentMethods = () =>
  getCached('payment-methods', 2 * 60_000, () => request('GET', '/payment-methods'));

export const updateCod = async (enabled: boolean) => {
  const res = await request('PATCH', '/payment-methods/cod', { enabled } as any);
  if (res.status === 200) invalidate('payment-methods');
  return res;
};

export const updateUpi = async (enabled: boolean, upiId?: string) => {
  const res = await request('PATCH', '/payment-methods/upi', {
    enabled,
    ...(upiId ? { upi_id: upiId } : {}),
  } as any);
  if (res.status === 200) invalidate('payment-methods');
  return res;
};

export const updateBankTransfer = async (
  enabled: boolean,
  details?: {
    account_name?: string;
    account_number?: string;
    ifsc?: string;
    bank_name?: string;
  },
) => {
  const res = await request('PATCH', '/payment-methods/bank-transfer', { enabled, ...details } as any);
  if (res.status === 200) invalidate('payment-methods');
  return res;
};

// ─── Delivery  (2 min TTL, invalidated on any update) ────────────────────────

export const getDelivery = () =>
  getCached('delivery', 2 * 60_000, () => request('GET', '/delivery'));

export const updateDelivery = async (data: Record<string, unknown>) => {
  const res = await request('PATCH', '/delivery', data);
  if (res.status === 200) invalidate('delivery');
  return res;
};

export const getZones = () => request('GET', '/delivery/zones');

export const createZone = (data: Record<string, unknown>) =>
  request('POST', '/delivery/zones', data);

export const updateZone = (id: number, data: Record<string, unknown>) =>
  request('PUT', `/delivery/zones/${id}`, data);

export const deleteZone = (id: number) =>
  request('DELETE', `/delivery/zones/${id}`);

// ─── Order Messages ───────────────────────────────────────────────────────────

export const getMessages = (orderId: number) =>
  request('GET', `/orders/${orderId}/messages`);

export const sendMessage = (orderId: number, message: string) =>
  request('POST', `/orders/${orderId}/messages`, { message } as any);

export const markMessagesRead = (orderId: number) =>
  request('POST', `/orders/${orderId}/messages/read`);

// ─── FCM ──────────────────────────────────────────────────────────────────────

export const registerFcmToken = (token: string) =>
  request('POST', '/fcm-token', { token } as any);

export const removeFcmToken = () => request('DELETE', '/fcm-token');

// ─── Billing  (5 min TTL, invalidated on successful plan change) ──────────────

export const getSubscription = () =>
  getCached('subscription', 5 * 60_000, () => request('GET', '/billing'));

export const initiateSubscription = (plan: string, cycle: 'monthly' | 'yearly') =>
  request('POST', '/billing/initiate', { plan, cycle } as any);

export const verifySubscription = (data: {
  order_id: string;
  payment_id: string;
  signature: string;
}) => {
  const res = request('POST', '/billing/verify', data as any);
  res.then((r) => { if (r.status === 200) { invalidate('subscription'); invalidate('settings'); } });
  return res;
};

// ─── Settings  (5 min TTL, invalidated on save) ───────────────────────────────

export const getSettings = () =>
  getCached('settings', 5 * 60_000, () => request('GET', '/settings'));

export const updateSettings = async (data: Record<string, unknown>) => {
  const res = await request('PATCH', '/settings', data);
  if (res.status === 200) invalidate('settings');
  return res;
};

export const updateHours = async (hours: Record<string, unknown>) => {
  const res = await request('PATCH', '/settings/hours', { hours });
  if (res.status === 200) invalidate('settings');
  return res;
};

export async function uploadLogo(formData: FormData) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/settings/logo`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (res.status === 200) invalidate('settings');
  return { status: res.status, data };
}
