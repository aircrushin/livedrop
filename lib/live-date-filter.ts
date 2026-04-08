export interface LiveDateFilter {
  dateKey: string;
  startUtc: string;
  endUtc: string;
}

const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const DATE_PARAM_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;
const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface ParsedChinaDate {
  year: number;
  month: number;
  day: number;
}

function normalizeDateParam(dateParam: string | string[] | null | undefined): string | null {
  if (Array.isArray(dateParam)) {
    return dateParam[0] ?? null;
  }

  return dateParam?.trim() || null;
}

function parseChinaDate(dateParam: string | string[] | null | undefined): ParsedChinaDate | null {
  const normalized = normalizeDateParam(dateParam);

  if (!normalized) {
    return null;
  }

  const match = DATE_PARAM_PATTERN.exec(normalized);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function getLiveDateFilter(
  dateParam: string | string[] | null | undefined
): LiveDateFilter | null {
  const parsed = parseChinaDate(dateParam);

  if (!parsed) {
    return null;
  }

  const { year, month, day } = parsed;
  const startMs = Date.UTC(year, month - 1, day) - CHINA_TIMEZONE_OFFSET_MS;
  const endMs = Date.UTC(year, month - 1, day + 1) - CHINA_TIMEZONE_OFFSET_MS;

  return {
    dateKey: `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`,
    startUtc: new Date(startMs).toISOString(),
    endUtc: new Date(endMs).toISOString(),
  };
}

export function formatChinaDateInput(dateParam: string | string[] | null | undefined): string {
  const parsed = parseChinaDate(dateParam);

  if (!parsed) {
    return "";
  }

  const { year, month, day } = parsed;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toLiveDateParam(dateInput: string | null | undefined): string | null {
  if (!dateInput) {
    return null;
  }

  const normalized = dateInput.trim();
  const match = DATE_INPUT_PATTERN.exec(normalized);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

export function getChinaTodayDateInput(now: Date = new Date()): string {
  const chinaNow = new Date(now.getTime() + CHINA_TIMEZONE_OFFSET_MS);

  return `${chinaNow.getUTCFullYear()}-${String(chinaNow.getUTCMonth() + 1).padStart(2, "0")}-${String(
    chinaNow.getUTCDate()
  ).padStart(2, "0")}`;
}

export function matchesLiveDateFilter(
  createdAt: string,
  dateFilter: LiveDateFilter | null
): boolean {
  if (!dateFilter) {
    return true;
  }

  const createdAtMs = new Date(createdAt).getTime();
  const startMs = new Date(dateFilter.startUtc).getTime();
  const endMs = new Date(dateFilter.endUtc).getTime();

  if ([createdAtMs, startMs, endMs].some(Number.isNaN)) {
    return false;
  }

  return createdAtMs >= startMs && createdAtMs < endMs;
}
