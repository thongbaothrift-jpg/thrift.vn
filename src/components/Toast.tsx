"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// Convenience methods
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, message?: string) =>
      addToast({ type: "success", title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: "error", title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: "warning", title, message }),
  };
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: CheckCircle,
    bg: "bg-white",
    border: "border-l-green-500",
    iconColor: "text-green-500",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-white",
    border: "border-l-red-500",
    iconColor: "text-red-500",
  },
  info: {
    icon: Info,
    bg: "bg-white",
    border: "border-l-blue-500",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-white",
    border: "border-l-yellow-500",
    iconColor: "text-yellow-500",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(onRemove, 200);
  }, [onRemove]);

  // Auto remove
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(handleRemove, duration);
    return () => clearTimeout(timer);
  }, [toast.duration, handleRemove]);

  return (
    <div
      className={`
        ${config.bg} border border-zinc-200 border-l-4 ${config.border}
        shadow-lg rounded-sm p-4 min-w-[320px] max-w-[420px]
        transform transition-all duration-200
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-sm text-zinc-500 mt-0.5">{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 -m-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Usage example:
// const { success, error } = useToastActions();
// success("Thành công!", "Sản phẩm đã được thêm vào giỏ hàng");
// error("Lỗi!", "Không thể thêm sản phẩm");
