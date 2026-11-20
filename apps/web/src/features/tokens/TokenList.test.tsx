import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { keysOf, keyPreview } from "./model.ts";
import { TokenList } from "./TokenList.tsx";

const keys = [
  { id: "a", name: "Navidrome du salon", start: "nd_8Kq2", createdAt: "2026-03-02T10:00:00Z" },
  { id: "b", name: null, start: null, createdAt: "2026-11-01T10:00:00Z" },
];

describe("token model", () => {
  test("newest first, from either answer shape", () => {
    expect(keysOf({ apiKeys: keys }).map((k) => k.id)).toEqual(["b", "a"]);
    expect(keysOf(keys).map((k) => k.id)).toEqual(["b", "a"]);
    expect(keyPreview(keys[0]!)).toBe("nd_8Kq2…");
  });
});

describe("TokenList", () => {
  test("revoking asks first, in the row", async () => {
    const onRevoke = vi.fn(async () => {});
    render(<TokenList keys={keys} freshId={null} onRevoke={onRevoke} />);
    expect(screen.getByText("Sans nom")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Révoquer" })[0]!);
    expect(screen.getByText("Révoquer « Navidrome du salon » ?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onRevoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Révoquer" })[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Révoquer" })[0]!);
    await vi.waitFor(() => expect(onRevoke).toHaveBeenCalledWith(keys[0]));
  });
});
