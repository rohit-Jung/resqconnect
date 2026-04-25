// Small helper to detect node-postgres errors without importing pg types.

export type PgErrorLike = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
  name?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  routine?: string;
  cause?: unknown;
};

export function isPgError(err: unknown, code: string) {
  const e = unwrapCause(err);
  return !!e && e.code === code;
}

export function unwrapPgError(err: unknown): PgErrorLike | null {
  return unwrapCause(err);
}

export function buildErrorCauseChain(err: unknown, maxDepth = 8) {
  const chain: Array<Record<string, unknown>> = [];
  let cur: any = err;

  for (let depth = 0; depth < maxDepth && cur; depth++) {
    if (typeof cur !== 'object') {
      chain.push({ depth, value: cur });
      break;
    }

    const e = cur as PgErrorLike & { stack?: unknown };
    chain.push({
      depth,
      name: e.name,
      message: e.message,
      code: e.code,
      detail: e.detail,
      constraint: e.constraint,
      schema: e.schema,
      table: e.table,
      column: e.column,
      dataType: e.dataType,
      routine: e.routine,
      stack:
        typeof (e as any).stack === 'string'
          ? // Keep logs readable; full stack is still present in node logs.
            String((e as any).stack)
              .split('\n')
              .slice(0, 25)
              .join('\n')
          : undefined,
    });

    cur = (e as any).cause;
  }

  return chain;
}

function unwrapCause(err: unknown, depth = 0): PgErrorLike | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as PgErrorLike;
  if (typeof e.code === 'string') return e;
  if (depth > 5) return null;
  return unwrapCause(e.cause, depth + 1);
}
