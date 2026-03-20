"use client";

import { useToastStore, type ToastType } from "@/stores/toast";
import { Check, X, AlertTriangle, Info } from "lucide-react";

const icons: Record<ToastType, React.ElementType> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: "bg-success text-white",
  error: "bg-error text-white",
  warning: "bg-warning text-white",
  info: "bg-primary-600 text-white",
};

const bgColors: Record<ToastType, string> = {
  success: "border-success/20 bg-success/5",
  error: "border-error/20 bg-error/5",
  warning: "border-warning/20 bg-warning/5",
  info: "border-primary-600/20 bg-primary-600/5",
};

const textColors: Record<ToastType, string> = {
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
  info: "text-primary-600",
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 lg:bottom-4">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-toast-in ${bgColors[toast.type]} dark:bg-dark-800 dark:border-dark-600`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colors[toast.type]}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <p className={`text-sm font-medium ${textColors[toast.type]} dark:text-dark-100`}>
              {toast.message}
            </p>
            <button
              onClick={() => remove(toast.id)}
              className="ml-2 shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:text-dark-300 dark:hover:text-dark-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
