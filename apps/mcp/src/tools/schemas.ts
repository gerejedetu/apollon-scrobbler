/** Argument schemas shared by several tools, with descriptions written for the model. */
import { z } from "zod";

export const range = z
  .enum([
    "this_week",
    "this_month",
    "this_year",
    "week",
    "month",
    "quarter",
    "half_yearly",
    "year",
    "all_time",
  ])
  .optional()
  .describe(
    "Period, in UTC. this_week / this_month / this_year = the current period so far (weeks start on Monday). " +
      "week / month / quarter / half_yearly / year = the last complete one (e.g. month = last calendar month). " +
      "all_time = the whole history (default).",
  );

export const limit = (max: number, fallback: number) =>
  z
    .number()
    .int()
    .min(1)
    .max(max)
    .optional()
    .describe(`How many items, 1 to ${max} (default ${fallback}).`);

export const offset = z
  .number()
  .int()
  .min(0)
  .optional()
  .describe("How many items to skip, for the next page (default 0).");

export const utcOffset = z
  .number()
  .int()
  .min(-720)
  .max(840)
  .optional()
  .describe(
    "The user's time zone as minutes east of UTC (Paris in winter = 60, New York in summer = -240). " +
      "Changes which day or hour a listen falls in. Default 0 (UTC).",
  );

export const artist = z
  .string()
  .min(1)
  .describe('Artist name exactly as listened, e.g. "Daft Punk".');
export const track = z.string().min(1).describe("Track title exactly as listened.");
export const album = z.string().min(1).describe("Album (release) title exactly as listened.");
