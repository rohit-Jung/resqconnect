import { cpOrganization } from '@repo/db/control-plane';
import { ApiResponse } from '@repo/utils/api';

import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { db } from '@/db';

function baseUrl(url: string) {
  return url.replace(/\/$/, '');
}

async function fetchInternalJson(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-internal-api-key': envConfig.internal_api_key },
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      error: text || `Request failed with status ${res.status}`,
    };
  }
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }
  return { ok: true as const, json };
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  primaryAddress: string;
  isVerified: boolean | null;
  role: string | null;
  createdAt: string;
};

export const listUsers = async (req: Request, res: Response) => {
  const pageRaw = typeof req.query?.page === 'string' ? req.query.page : '1';
  const limitRaw =
    typeof req.query?.limit === 'string' ? req.query.limit : '20';
  const searchRaw =
    typeof req.query?.search === 'string' ? req.query.search.trim() : '';

  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitRaw) || 20));

  const siloRows = await db
    .select({ siloBaseUrl: cpOrganization.siloBaseUrl })
    .from(cpOrganization);

  const uniqueUrls = Array.from(
    new Set(
      siloRows
        .map(r => (typeof r.siloBaseUrl === 'string' ? r.siloBaseUrl : ''))
        .filter(Boolean)
    )
  );

  if (uniqueUrls.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, 'OK', { total: 0, page, limit, users: [] }));
  }

  // Fetch enough rows from each silo to cover global pagination
  const perSiloLimit = page * limit;
  const q = new URLSearchParams({
    page: '1',
    limit: String(perSiloLimit),
  });
  if (searchRaw) q.set('search', searchRaw);

  const results = await Promise.all(
    uniqueUrls.map(async siloUrl => {
      const url = `${baseUrl(siloUrl)}/api/v1/internal/users?${q.toString()}`;
      const r = await fetchInternalJson(url);
      if (!r.ok) return null;
      return r.json;
    })
  );

  let total = 0;
  const allUsers: UserRow[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (!result || typeof result !== 'object') continue;
    const data = (result as any)?.data ?? result;
    const rowTotal = typeof data?.total === 'number' ? data.total : 0;
    total += rowTotal;

    const rows = Array.isArray(data?.users) ? data.users : [];
    for (const u of rows) {
      if (!u || typeof u !== 'object') continue;
      const key =
        typeof u.email === 'string' ? u.email.toLowerCase() : `id:${u.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allUsers.push(u as UserRow);
    }
  }

  allUsers.sort((a, b) => {
    const at = new Date(a.createdAt).getTime() || 0;
    const bt = new Date(b.createdAt).getTime() || 0;
    return bt - at;
  });

  const offset = (page - 1) * limit;
  const users = allUsers.slice(offset, offset + limit);

  return res
    .status(200)
    .json(new ApiResponse(200, 'OK', { total, page, limit, users }));
};
