export type JsonRecord = Record<string, unknown>;

export async function postJson<T = unknown>(
  url: string,
  body: JsonRecord,
  headers: Record<string, string> = {}
): Promise<
  { ok: true; data: T } | { ok: false; status: number; error: string }
> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      status: res.status,
      error: text || `Request failed with status ${res.status}`,
    };
  }

  const data = (await res.json().catch(() => null)) as T;
  return { ok: true, data };
}
