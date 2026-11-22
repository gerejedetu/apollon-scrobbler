import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { css, cx } from "styled-system/css";

export const input = css({
  height: "40px",
  px: "12px",
  border: 0,
  borderRadius: "field",
  bg: "field",
  font: "inherit",
  fontSize: "13px",
  fontWeight: "400",
  color: "ink",
  width: "100%",
  minWidth: 0,
  outline: "none",
  // Fields show the global focus ring like everything else, plus a primary edge while typing.
  _focus: { boxShadow: "inset 0 0 0 1px token(colors.focus)" },
  "&[aria-invalid=true]": { bg: "dangerBg", boxShadow: "inset 0 0 0 1px token(colors.dangerLine)" },
});

const label = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontSize: "13px",
  fontWeight: "500",
});

const hintStyle = css({ fontSize: "12px", fontWeight: "400", color: "muted" });
const errorStyle = css({ fontSize: "12px", fontWeight: "400", color: "dangerInk" });

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
}

/** A labelled input with an optional hint, or an error that replaces it. */
export function Field({ label: text, hint, error, className, ...inputProps }: FieldProps) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <label className={cx(label, className)}>
      {text}
      <input
        className={input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <span id={describedBy} className={errorStyle}>
          {error}
        </span>
      ) : hint ? (
        <span id={describedBy} className={hintStyle}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}
