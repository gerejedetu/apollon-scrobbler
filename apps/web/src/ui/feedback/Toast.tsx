import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { CloseIcon } from "../icons.tsx";

type Show = (message: string) => void;
const ToastContext = createContext<Show>(() => {});

/** The violet pill of the design ("Écoute supprimée."), bottom centre, gone after 4 s or on close. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);
  const show = useCallback<Show>((text) => setMessage({ text, id: Date.now() }), []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={css({
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "24px",
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 30,
        })}
      >
        {message ? (
          <span
            key={message.id}
            className={css({
              pointerEvents: "auto",
              height: "36px",
              px: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              borderRadius: "18px",
              bg: "violet",
              color: "page",
              fontSize: "13px",
              fontWeight: "500",
            })}
          >
            {message.text}
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setMessage(null)}
              className={css({
                border: 0,
                bg: "transparent",
                color: "page",
                p: 0,
                display: "flex",
              })}
            >
              <CloseIcon />
            </button>
          </span>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
