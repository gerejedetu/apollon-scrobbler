import { describe, expect, test } from "vite-plus/test";
import { ApiError } from "@scrobbler/client";
import { emptyTrack, orEmpty } from "./empty.ts";

describe("orEmpty", () => {
  test("answers the empty page on a 404", async () => {
    const page = await orEmpty(Promise.reject(new ApiError(404, "No listens")), () =>
      emptyTrack("Krisu", "New", "all_time"),
    );
    expect(page.listenCount).toBe(0);
    expect(page.track).toBe("New");
  });
  test("lets other errors through", async () => {
    await expect(
      orEmpty(Promise.reject(new ApiError(500, "Boom")), () => emptyTrack("a", "b", "all_time")),
    ).rejects.toThrow("Boom");
  });
});
