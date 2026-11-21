import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { browserOffset, OFFSET_COOKIE, OFFSET_SCRIPT } from "./timezone.ts";

function run() {
  const reload = vi.fn();
  // Running the inline script is the point of this test; it only reads location.reload.
  // oxlint-disable-next-line typescript/no-implied-eval
  new Function("location", OFFSET_SCRIPT)({ reload });
  return reload;
}

afterEach(() => {
  document.cookie = `${OFFSET_COOKIE}=; path=/; max-age=0`;
  sessionStorage.clear();
});

describe("OFFSET_SCRIPT", () => {
  test("stores the offset and reloads once on a first visit", () => {
    expect(run()).toHaveBeenCalledOnce();
    expect(document.cookie).toContain(`${OFFSET_COOKIE}=${browserOffset()}`);
    expect(run()).not.toHaveBeenCalled();
  });

  test("does nothing when the cookie already matches", () => {
    document.cookie = `${OFFSET_COOKIE}=${browserOffset()}; path=/`;
    expect(run()).not.toHaveBeenCalled();
  });

  test("reloads at most once per tab even if the cookie is stale again", () => {
    document.cookie = `${OFFSET_COOKIE}=${browserOffset() + 60}; path=/`;
    expect(run()).toHaveBeenCalledOnce();
    document.cookie = `${OFFSET_COOKIE}=${browserOffset() + 60}; path=/`;
    expect(run()).not.toHaveBeenCalled();
  });
});
