export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

const ACCESS = "tbn_admin_access";
const REFRESH = "tbn_admin_refresh";
const USER = "tbn_admin_user";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getUser(): SessionUser | null {
  const raw = read(USER);
  if (!raw || !read(REFRESH)) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function saveTokens(t: Tokens) {
  localStorage.setItem(ACCESS, t.accessToken);
  localStorage.setItem(REFRESH, t.refreshToken);
}

export function logout() {
  [ACCESS, REFRESH, USER].forEach((k) => localStorage.removeItem(k));
  // Full reload also drops the react-query cache.
  if (location.pathname !== "/login") location.replace("/login");
}

async function errorFrom(res: Response): Promise<ApiError> {
  let message = res.statusText || `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) message = body.message.join(". ");
    else if (body.message) message = body.message;
  } catch {
    /* non-JSON body */
  }
  return new ApiError(message, res.status);
}

// Single-flight: concurrent 401s share one refresh call.
let refreshing: Promise<boolean> | null = null;
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = read(REFRESH);
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      saveTokens((await res.json()) as Tokens);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

type Query = Record<string, string | number | undefined | null>;

/** Authenticated request with one refresh-and-retry on 401; throws ApiError on failure. */
async function request(
  path: string,
  opts: { method?: string; body?: unknown; query?: Query } = {},
): Promise<Response> {
  const url = new URL(`${API_URL}/api/v1${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const send = () =>
    fetch(url, {
      method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
      headers: {
        ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(read(ACCESS) ? { Authorization: `Bearer ${read(ACCESS)}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });

  let res = await send();
  if (res.status === 401) {
    if (await refresh()) res = await send();
    if (res.status === 401) {
      logout();
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
  }
  if (!res.ok) throw await errorFrom(res);
  return res;
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const text = await (await request(path, opts)).text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Download a protected file (e.g. an ID document) as a Blob. */
export async function apiBlob(path: string): Promise<Blob> {
  return (await request(path)).blob();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await errorFrom(res);
  const data = (await res.json()) as Tokens & { user: SessionUser };
  if (data.user.role !== "ADMIN") {
    throw new ApiError("This account is not an administrator. Use the main site to sign in.", 403);
  }
  saveTokens(data);
  localStorage.setItem(
    USER,
    JSON.stringify({ id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role }),
  );
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");
