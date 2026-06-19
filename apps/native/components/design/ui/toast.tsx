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

  return (
    <View className="absolute top-4 right-4 left-4 z-50">
      {toasts.map((toast, index) => (
        <View
          className={`mb-2 rounded-lg p-4 shadow-lg ${toast.type === "error" ? "bg-destructive" : toast.type === "warning" ? "bg-yellow-500" : toast.type === "info" ? "bg-blue-500" : "bg-green-500"}`}
          key={index}
        >
          {toast.title && (
            <Text className="mb-1 font-bold text-white">{toast.title}</Text>
          )}
          {toast.message && <Text className="text-white">{toast.message}</Text>}
        </View>
      ))}
    </View>
  );
}
