"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, message }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg shadow-stone-900/10"
          >
            <span
              className={
                t.kind === "success"
                  ? "text-pine-600"
                  : t.kind === "error"
                    ? "text-rose-600"
                    : "text-amber-600"
              }
            >
              {t.kind === "success" ? (
                <CheckCircle2 size={20} />
              ) : t.kind === "error" ? (
                <XCircle size={20} />
              ) : (
                <Info size={20} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug">{t.title}</p>
              {t.message ? (
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{t.message}</p>
              ) : null}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
