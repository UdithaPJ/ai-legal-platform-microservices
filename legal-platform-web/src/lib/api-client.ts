const GW = process.env.API_GATEWAY_URL ?? "http://localhost:8080";

function withJsonHeaders(options: RequestInit = {}): Headers {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

// Called from server-side code to hit the API gateway with a bearer token.
export async function gatewayFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = withJsonHeaders(options);
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${GW}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway ${res.status} ${path}: ${text}`);
  }
  return res.json();
}

// Called from client components to hit the Next.js BFF routes at /api/*.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: withJsonHeaders(options),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${path}: ${text}`);
  }
  return res.json();
}
