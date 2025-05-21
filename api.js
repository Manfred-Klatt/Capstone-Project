// === api.js ===
const API_BASE = 'https://api.nookipedia.com';
const TIMEOUT = 5000;
let cachedData = {};

export async function fetchData(category) {
  if (cachedData[category]) return cachedData[category];

  const url = `${API_BASE}/${category}/`;
  const data = await fetchWithTimeout(url);
  cachedData[category] = data;
  return data;
}

export async function fetchWithTimeout(resource, options = {}, timeout = TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  } finally {
    clearTimeout(id);
  }
}
