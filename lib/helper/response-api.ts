let isHandlingUnauthorized = false;

export function handleUnauthorizedClient() {
  if (typeof window === "undefined" || isHandlingUnauthorized) return;

  isHandlingUnauthorized = true;

  try {
    localStorage.removeItem("hr_user_data");
    localStorage.removeItem("hr_user_role");
  } catch {
    // ignore localStorage access failures
  }

  window.location.href = "/login";
}

export async function parseApiError(res: Response, fallback: string) {
  if (res.status === 401) {
    handleUnauthorizedClient();
  }

  try {
    const json = await res.json();
    return json?.message || json?.detail || fallback;
  } catch {
    return fallback;
  }
}
