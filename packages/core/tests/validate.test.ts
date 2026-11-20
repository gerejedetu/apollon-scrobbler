import { describe, expect, test } from "vite-plus/test";
import { ApiError, LISTEN_LIMITS, validateSubmission } from "../src/index.ts";

const TS = 1_700_000_000;
const MBID = "8f3471b5-7e6a-48da-86a9-c1c07a0f47ae";
const track = { artist_name: "Daft Punk", track_name: "One More Time" };

function expectError(body: unknown, code = 400): ApiError {
  try {
    validateSubmission(body);
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect((e as ApiError).code).toBe(code);
    return e as ApiError;
  }
  throw new Error("expected validateSubmission to throw");
}

describe("validateSubmission", () => {
  test("accepts a single listen and trims names", () => {
    const res = validateSubmission({
      listen_type: "single",
      payload: [
        {
          listened_at: TS,
          track_metadata: {
            artist_name: " Daft Punk ",
            track_name: "One More Time",
            release_name: "Discovery",
          },
        },
      ],
    });
    expect(res.listenType).toBe("single");
    expect(res.listens[0]).toEqual({
      listenedAt: TS,
      trackMetadata: {
        artist_name: "Daft Punk",
        track_name: "One More Time",
        release_name: "Discovery",
        additional_info: {},
      },
    });
  });

  test("playing_now needs no listened_at and ignores one", () => {
    const res = validateSubmission({
      listen_type: "playing_now",
      payload: [{ listened_at: TS, track_metadata: track }],
    });
    expect(res.listens[0]?.listenedAt).toBeNull();
  });

  test("rejects bodies that are not objects", () => {
    expectError(null);
    expectError([]);
    expectError("x");
  });

  test("rejects unknown listen_type and empty payload", () => {
    expectError({ listen_type: "bogus", payload: [{ listened_at: TS, track_metadata: track }] });
    expectError({ listen_type: "import", payload: [] });
    expectError({ listen_type: "import" });
  });

  test("single and playing_now carry exactly one listen", () => {
    const two = [
      { listened_at: TS, track_metadata: track },
      { listened_at: TS + 1, track_metadata: track },
    ];
    expectError({ listen_type: "single", payload: two });
    expectError({ listen_type: "playing_now", payload: two });
    expect(validateSubmission({ listen_type: "import", payload: two }).listens).toHaveLength(2);
  });

  test("caps the number of listens per request", () => {
    const many = Array.from({ length: LISTEN_LIMITS.maxListensPerRequest + 1 }, (_, i) => ({
      listened_at: TS + i,
      track_metadata: track,
    }));
    expectError({ listen_type: "import", payload: many });
  });

  test("requires artist_name and track_name", () => {
    expectError({
      listen_type: "single",
      payload: [{ listened_at: TS, track_metadata: { track_name: "x" } }],
    });
    expectError({
      listen_type: "single",
      payload: [{ listened_at: TS, track_metadata: { artist_name: "x", track_name: "  " } }],
    });
    expectError({ listen_type: "single", payload: [{ listened_at: TS }] });
  });

  test("validates listened_at", () => {
    expectError({ listen_type: "single", payload: [{ track_metadata: track }] });
    expectError({
      listen_type: "single",
      payload: [{ listened_at: "1700000000", track_metadata: track }],
    });
    expectError({
      listen_type: "single",
      payload: [{ listened_at: 1.5e9 + 0.5, track_metadata: track }],
    });
    const low = expectError({
      listen_type: "single",
      payload: [{ listened_at: LISTEN_LIMITS.minimumTs - 1, track_metadata: track }],
    });
    expect(low.message).toContain("too low");
  });

  test("drops invalid MBIDs and lowercases valid ones", () => {
    const res = validateSubmission({
      listen_type: "single",
      payload: [
        {
          listened_at: TS,
          track_metadata: {
            ...track,
            additional_info: {
              recording_mbid: "not-a-uuid",
              release_mbid: MBID,
              artist_mbids: [MBID.toUpperCase(), "nope"],
              work_mbids: ["nope"],
              custom: { kept: true },
            },
          },
        },
      ],
    });
    expect(res.listens[0]?.trackMetadata.additional_info).toEqual({
      release_mbid: MBID,
      artist_mbids: [MBID],
      custom: { kept: true },
    });
  });

  test("validates tags and durations", () => {
    const withInfo = (additional_info: unknown) => ({
      listen_type: "single",
      payload: [{ listened_at: TS, track_metadata: { ...track, additional_info } }],
    });
    expectError(withInfo("x"));
    expectError(withInfo({ tags: "rock" }));
    expectError(withInfo({ tags: Array.from({ length: 51 }, () => "t") }));
    expectError(withInfo({ tags: ["x".repeat(65)] }));
    expectError(withInfo({ duration_ms: -1 }));
    expectError(withInfo({ duration: 1.5 }));
    expect(
      validateSubmission(withInfo({ tags: ["rock"], duration_ms: 1000 })).listens,
    ).toHaveLength(1);
  });

  test("rejects oversized listens", () => {
    expectError({
      listen_type: "single",
      payload: [
        {
          listened_at: TS,
          track_metadata: { ...track, additional_info: { blob: "x".repeat(11_000) } },
        },
      ],
    });
  });
});
