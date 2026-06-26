import { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface ToastOptions {
  message?: string;
  title?: string;
  type?: "success" | "error" | "warning" | "info";
}

let toastHandlers: ((options: ToastOptions) => void) | null = null;

export function showToast(options: ToastOptions) {
  toastHandlers?.(options);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  useEffect(() => {
    toastHandlers = (options) => {
      setToasts((prev) => [...prev, options]);
      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
    };

    return () => {
      toastHandlers = null;
    };
  }, []);

  return { toasts };
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50" pointerEvents="box-none">
      <View className="absolute top-4 right-4 left-4 gap-2" pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <View
            className={`rounded-lg p-4 shadow-lg backdrop-blur-[1px] ${toast.type === "error" ? "bg-rose-700/60" : toast.type === "warning" ? "bg-yellow-700/60" : toast.type === "info" ? "bg-blue-700/60" : "bg-green-700/60"}`}
            key={index}
          >
            {toast.title && (
              <Text className="mb-1 font-bold text-white">{toast.title}</Text>
            )}
            {toast.message && <Text className="text-white">{toast.message}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}
