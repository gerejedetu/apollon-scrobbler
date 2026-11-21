import { useState } from "react";
import { css } from "styled-system/css";
import type { ApiKey } from "../../api/index.ts";
import { formatAgo, formatDate } from "../../lib/format/index.ts";
import { Button, capsLabel, CountBadge, NewTag, Notice } from "../../ui/primitives/index.ts";
import { keyName, keyPreview } from "./model.ts";
import { color } from "../../ui/theme/index.ts";
import { m } from "../../paraglide/messages.js";

const head = css({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  pb: "8px",
  borderBottom: "1px solid token(colors.rule)",
});
const row = css({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  py: "14px",
  borderBottom: "1px solid token(colors.ruleSoft)",
  fontSize: "13px",
});
const cell = css({ width: "120px", color: "muted" });
const hideOnPhone = css({ display: { base: "none", sm: "inline" } });
const actions = css({ width: "160px", display: "flex", justifyContent: "flex-end" });

function createdLabel(createdAt: string): string {
  const seconds = Date.parse(createdAt) / 1000;
  return Date.now() / 1000 - seconds < 60 ? formatAgo(seconds) : formatDate(seconds);
}

/** "Tes tokens": name, start of the key, creation date; revoking asks first, in the row itself. */
export function TokenList({
  keys,
  freshId,
  onRevoke,
}: {
  keys: ApiKey[];
  freshId: string | null;
  onRevoke: (key: ApiKey) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function revoke(key: ApiKey) {
    setBusy(true);
    setFailed(null);
    try {
      await onRevoke(key);
      setConfirming(null);
    } catch {
      setFailed(m.token_revoke_failed({ name: keyName(key) }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={css({ display: "flex", flexDirection: "column" })}>
      <h2
        className={css({
          m: "0 0 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textStyle: "block",
        })}
      >
        {m.your_tokens()} <CountBadge>{keys.length}</CountBadge>
      </h2>
      {failed ? <Notice tone="error">{failed}</Notice> : null}
      {keys.length === 0 ? (
        <p className={css({ m: 0, py: "14px", fontSize: "13px", color: "muted" })}>
          {m.tokens_empty()}
        </p>
      ) : (
        <div className={css({ overflowX: "auto" })}>
          <div className={css({ minWidth: "560px" })}>
            <div className={head}>
              <span className={capsLabel} style={{ flex: 1 }}>
                {m.caps_name()}
              </span>
              <span className={`${capsLabel} ${hideOnPhone}`} style={{ width: 120 }}>
                {m.caps_start()}
              </span>
              <span className={capsLabel} style={{ width: 120 }}>
                {m.caps_created()}
              </span>
              <span style={{ width: 160 }} />
            </div>
            {keys.map((key) =>
              confirming === key.id ? (
                <div
                  key={key.id}
                  className={row}
                  style={{
                    flexWrap: "wrap",
                    gap: "12px 16px",
                    padding: "14px 8px",
                    background: color("dangerBg"),
                  }}
                >
                  <span
                    className={css({
                      flex: "1 1 200px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    })}
                  >
                    <b className={css({ fontWeight: "600" })}>
                      {m.token_revoke_confirm({ name: keyName(key) })}
                    </b>
                    <span className={css({ fontSize: "12px", color: "dangerInk" })}>
                      {m.token_revoke_help()}
                    </span>
                  </span>
                  <span className={css({ display: "flex", gap: "8px" })}>
                    <Button
                      tone="outline"
                      size="sm"
                      onClick={() => setConfirming(null)}
                      disabled={busy}
                    >
                      {m.cancel()}
                    </Button>
                    <Button tone="danger" size="sm" onClick={() => revoke(key)} disabled={busy}>
                      {m.revoke()}
                    </Button>
                  </span>
                </div>
              ) : (
                <div
                  key={key.id}
                  className={row}
                  style={key.id === freshId ? { background: color("violetSoft") } : undefined}
                >
                  <span
                    className={css({ flex: 1, fontWeight: "500" })}
                    style={key.id === freshId ? { paddingLeft: 8 } : undefined}
                  >
                    {keyName(key)}
                    {key.id === freshId ? <NewTag className={css({ ml: "6px" })} /> : null}
                  </span>
                  <span className={`${cell} ${hideOnPhone}`}>{keyPreview(key)}</span>
                  <span className={cell}>{createdLabel(key.createdAt)}</span>
                  <span className={actions}>
                    <Button tone="outline" size="sm" onClick={() => setConfirming(key.id)}>
                      {m.revoke()}
                    </Button>
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}
