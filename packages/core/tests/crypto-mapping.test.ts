import { describe, expect, test } from "vite-plus/test";
import {
  recordingMsid,
  sha256Hex,
  timingSafeEqual,
  toApiListen,
  toNewListen,
  uuidV5,
} from "../src/index.ts";

describe("crypto", () => {
  test("sha256Hex matches a known vector", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("uuidV5 matches the RFC example (DNS namespace, www.example.com)", async () => {
    expect(await uuidV5("www.example.com", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(
      "2ed6657d-e927-568b-95e1-2665a8aea6a2",
    );
  });

  test("timingSafeEqual", () => {
    expect(timingSafeEqual("secret", "secret")).toBe(true);
    expect(timingSafeEqual("secret", "secreT")).toBe(false);
    expect(timingSafeEqual("secret", "secret2")).toBe(false);
  });
});

describe("listen mapping", () => {
  const meta = { artist_name: "Daft Punk", track_name: "One More Time", release_name: "Discovery" };

  test("recordingMsid is deterministic and case-insensitive", async () => {
    const a = await recordingMsid(meta);
    expect(
      await recordingMsid({
        artist_name: "DAFT PUNK ",
        track_name: "one more time",
        release_name: "discovery",
      }),
    ).toBe(a);
    expect(await recordingMsid({ ...meta, release_name: "Alive 2007" })).not.toBe(a);
  });

  test("toNewListen extracts MBIDs and round-trips through toApiListen", async () => {
    const mbid = "8f3471b5-7e6a-48da-86a9-c1c07a0f47ae";
    const listen = await toNewListen(1_700_000_000, {
      ...meta,
      additional_info: {
        recording_mbid: mbid,
        artist_mbids: [mbid],
        recording_msid: "client-sent",
      },
    });
    expect(listen.recordingMbid).toBe(mbid);
    expect(listen.artistMbids).toEqual([mbid]);
    expect(listen.additionalInfo.recording_msid).toBeUndefined();

    const api = toApiListen({ ...listen, userId: 1, insertedAt: 1_700_000_100 }, "alice");
    expect(api).toMatchObject({
      listened_at: 1_700_000_000,
      inserted_at: 1_700_000_100,
      user_name: "alice",
      recording_msid: listen.recordingMsid,
      track_metadata: {
        artist_name: "Daft Punk",
        release_name: "Discovery",
        additional_info: { recording_msid: listen.recordingMsid },
      },
    });
  });
});
