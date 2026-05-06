"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: string; message: string; type: ToastType }
interface ToastCtx { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  function dismiss(id: string) {
    setToasts(p => p.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              "toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white pointer-events-auto min-w-[260px] max-w-sm",
              t.type === "success" && "bg-emerald-600",
              t.type === "error"   && "bg-red-500",
              t.type === "info"    && "bg-[#3b7ef6]",
            )}
          >
            {t.type === "success" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {t.type === "error"   && <XCircle      className="w-4 h-4 flex-shrink-0" />}
            {t.type === "info"    && <Info         className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity pointer-events-auto">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
