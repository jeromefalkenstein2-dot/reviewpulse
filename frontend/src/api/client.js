/**
 * API client that automatically attaches the Shopify App Bridge session token.
 *
 * Usage:
 *   import { apiClient } from '../api/client';
 *   const data = await apiClient.get('/api/shop');
 */

let getSessionTokenFn = null;

export function setSessionTokenProvider(fn) {
  getSessionTokenFn = fn;
}

const IS_DEV = import.meta.env.DEV;
const DEV_SHOP = 'dev-shop.myshopify.com';

async function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  if (IS_DEV) {
    // In dev mode, bypass App Bridge and use the dev shop header
    headers['x-dev-shop'] = DEV_SHOP;
    return headers;
  }

  if (getSessionTokenFn) {
    try {
      const token = await getSessionTokenFn();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.warn('[API] Could not get session token:', err.message);
    }
  }
  return headers;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(method, path, body) {
  const headers = await getHeaders();
  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(err.error || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};
