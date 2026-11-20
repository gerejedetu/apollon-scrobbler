/** Query-string parsing shared by the insights endpoints. Every parser throws a 400 on bad input. */
import type { InsightEntity } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";

export type Raw = string | undefined;

export function int(name: string, raw: Raw, fallback: number, min: number, max: number): number {
  if (raw === undefined || raw === "") return fallback;
  if (!/^-?\d+$/.test(raw) || Number(raw) < min || Number(raw) > max) {
    throw ApiError.badRequest(`Invalid ${name}: an integer between ${min} and ${max}.`);
  }
  return Number(raw);
}

/** Minutes east of UTC (Paris in winter = 60), returned in seconds. */
export function utcOffset(raw: Raw): number {
  return int("utcOffset", raw, 0, -720, 840) * 60;
}

export function limit(raw: Raw, fallback = 25): number {
  return int("limit", raw, fallback, 1, 100);
}

export function oneOf<T extends string>(
  name: string,
  raw: Raw,
  values: readonly T[],
  fallback: T,
): T {
  if (raw === undefined || raw === "") return fallback;
  if (!values.includes(raw as T))
    throw ApiError.badRequest(`Invalid ${name}: use ${values.join(", ")}.`);
  return raw as T;
}

export const ENTITIES: readonly InsightEntity[] = ["artists", "recordings", "releases"];

export function entity(raw: Raw, fallback: InsightEntity = "artists"): InsightEntity {
  return oneOf("entity", raw, ENTITIES, fallback);
}

export const DAY = 86_400;

export function dayToDate(day: number): string {
  return new Date(day * DAY * 1000).toISOString().slice(0, 10);
}

/** `week` index (weeks since the Monday before 1970-01-01) -> date of that Monday. */
export function weekToDate(week: number): string {
  return dayToDate(week * 7 - 3);
}

/** Percentage change, rounded to one decimal; null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
