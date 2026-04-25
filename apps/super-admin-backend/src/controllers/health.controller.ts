import type { Request, Response } from 'express';

import { db } from '@/db';

export const healthcheck = async (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
};

export const dbHealthcheck = async (_req: Request, res: Response) => {
  // Intentionally low-cost: validates connection + reports current DB.
  // Drizzle wraps a node-postgres client under `db._.session.client`.
  // We intentionally avoid importing pg types here.
  const session = (db as any)?._?.session;
  if (!session?.client?.query) {
    return res.status(200).json({ ok: true, db: null });
  }

  const result = await session.client.query(
    'select current_database() as db, current_schema() as schema, inet_server_addr() as server_addr, inet_server_port() as server_port'
  );
  const info = result?.rows?.[0] ?? null;
  return res.status(200).json({ ok: true, db: info });
};
