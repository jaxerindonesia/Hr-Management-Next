export async function parseApiError(res: Response, fallback: string) {
  try {
    const json = await res.json();
    return json?.message || json?.detail || fallback;
  } catch {
    return fallback;
  }
}