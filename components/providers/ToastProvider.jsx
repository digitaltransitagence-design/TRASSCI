"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { AlertCircle, Check } from "lucide-react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`animate-fade-in fixed top-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-xl border-l-4 px-5 py-4 text-sm font-bold text-white shadow-2xl ${
            toast.type === "error"
              ? "border-red-200 bg-red-600"
              : "border-green-500 bg-slate-900"
          }`}
          role="status"
        >
          {toast.type === "error" ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : (
            <Check className="h-5 w-5 shrink-0" />
          )}
          <p>{toast.message}</p>
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast doit être utilisé sous ToastProvider");
  }
  return ctx;
}
