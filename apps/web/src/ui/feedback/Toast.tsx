import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Toast, ToastRegion } from "../apollon/index.ts";

type Kind = "success" | "error" | "info";
type Show = (message: string, kind?: Kind) => void;
const ToastContext = createContext<Show>(() => {});

/**
 * Notices after an action ("Réglages enregistrés.", "Écoute supprimée."): the design system's Toast in its
 * ToastRegion, bottom centre, gone after 4 s or on close. One region, mounted once at the root.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ text: string; kind: Kind; id: number } | null>(null);
  const show = useCallback<Show>(
    (text, kind = "success") => setMessage({ text, kind, id: Date.now() }),
    [],
  );
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastRegion>
        {message ? (
          <Toast
            key={message.id}
            kind={message.kind}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        ) : null}
      </ToastRegion>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
