import { useEffect, useRef } from "react";
import { css } from "styled-system/css";

/**
 * Infinite scroll: asks for the next page when this line comes within a screen of the viewport.
 * Without IntersectionObserver (or before hydration) the link-free button still loads it.
 */
export function LoadMore({
  onMore,
  loading,
  label,
  loadingLabel,
}: {
  onMore: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const more = useRef(onMore);
  more.current = onMore;
  const busy = useRef(loading);
  busy.current = loading;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !busy.current) more.current();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onMore}
      disabled={loading}
      aria-live="polite"
      className={css({
        alignSelf: "center",
        mt: "8px",
        px: "12px",
        height: "32px",
        border: 0,
        bg: "transparent",
        fontSize: "12px",
        color: "muted",
        cursor: "pointer",
        _hover: { color: "ink" },
        _disabled: { cursor: "progress" },
      })}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
