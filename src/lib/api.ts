const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Refresh token is sent via httpOnly cookie automatically
    });

    if (!res.ok) return null;

    const body = await res.json();
    const token = body.data?.access_token;
    if (token) {
      localStorage.setItem("auth_token", token);
    }
    return token;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add session ID for cart operations
  if (path.startsWith("/cart")) {
    const sessionId = sessionStorage.getItem("cart_session_id");
    if (sessionId) {
      headers["X-Session-Id"] = sessionId;
    }
  }

  // Add CSRF token for state-changing requests
  const method = (options.method || "GET").toUpperCase();
  if (method === "POST" || method === "PUT" || method === "DELETE") {
    const csrfToken = localStorage.getItem("csrf_token");
    if (csrfToken) {
      headers["X-Csrf-Token"] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Auto-refresh token on 401
  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      // Retry with new token
      headers["Authorization"] = `Bearer ${newToken}`;
      const retry = await fetch(url, { ...options, headers });
      if (!retry.ok) {
        const body = await retry.json().catch(() => ({}));
        throw new ApiError(
          retry.status,
          body.code || "UNKNOWN_ERROR",
          body.message || `Request failed: ${retry.status}`,
        );
      }
      return retry.json();
    }

    // Refresh failed — clear auth and redirect to login
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("csrf_token");
    window.location.href = "/login";
    throw new ApiError(401, "UNAUTHORIZED", "Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.code || "UNKNOWN_ERROR",
      body.message || `Request failed: ${response.status}`,
    );
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
