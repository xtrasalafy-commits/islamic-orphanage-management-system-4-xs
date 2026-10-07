export async function fetcher<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = "Terjadi kesalahan. Silakan coba lagi.";
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(url: string) => fetcher<T>(url),
  post: <T>(url: string, body: unknown) =>
    fetcher<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    fetcher<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(url: string) => fetcher<T>(url, { method: "DELETE" }),
};

export const SWR_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};
