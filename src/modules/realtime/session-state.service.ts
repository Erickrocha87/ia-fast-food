import { redis } from "src/infrastructure/redis/redis";

export interface TableSessionState {
  tableNumber: string;
  currentOrderId: number | null;
  summary: string | null;   
  updatedAt: number;   
}


function base(tableNumber: string, suffix: string) {
  return `serveai:table:${tableNumber}:${suffix}`;
}

function stateKey(tableNumber: string) {
  return base(tableNumber, "state");
}

function summaryKey(tableNumber: string) {
  return base(tableNumber, "summary");
}

function lastTranscriptKey(tableNumber: string) {
  return base(tableNumber, "last_transcript");
}

function toolCacheKey(key: string) {
  return `toolcache:${key}`;
}

export async function getTableState(
  tableNumber: string
): Promise<TableSessionState | null> {
  const raw = await redis.get(stateKey(tableNumber));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TableSessionState;
  } catch {
    return null;
  }
}

export async function saveTableState(
  state: TableSessionState
): Promise<void> {
  await redis.set(stateKey(state.tableNumber), JSON.stringify(state), "EX", 3600);
}

export async function updateTableState(
  tableNumber: string,
  patch: Partial<Omit<TableSessionState, "tableNumber">>
): Promise<TableSessionState> {
  const current =
    (await getTableState(tableNumber)) || {
      tableNumber,
      currentOrderId: null,
      summary: null,
      updatedAt: Date.now(),
    };

  const next: TableSessionState = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };

  await saveTableState(next);
  return next;
}

export async function setTableSummary(
  tableNumber: string,
  summary: string
): Promise<void> {
  await redis.set(summaryKey(tableNumber), summary, "EX", 86400); // 24h
  await updateTableState(tableNumber, { summary });
}

export async function getTableSummary(
  tableNumber: string
): Promise<string | null> {
  return (await redis.get(summaryKey(tableNumber))) as string | null;
}

export async function setLastTranscript(
  tableNumber: string,
  text: string
): Promise<void> {
  await redis.set(lastTranscriptKey(tableNumber), text, "EX", 300); // 5 min
}

export async function getLastTranscript(
  tableNumber: string
): Promise<string | null> {
  return (await redis.get(lastTranscriptKey(tableNumber))) as string | null;
}

export async function toolCache<T = any>(
  key: string,
  value?: T
): Promise<T | null> {
  const redisKey = toolCacheKey(key);

  if (typeof value === "undefined") {
    const raw = await redis.get(redisKey);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  await redis.set(redisKey, JSON.stringify(value), "EX", 3600);
  return value;
}
