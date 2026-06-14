'use client';

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { create } from "@/utils/context";

export type _ToastType = "success" | "error" | "info";

interface ToastItem {
  duration?: number;
  id: string;
  message?: string;
  title: string;
  type: _ToastType;
}

interface ToastContext {
  dismiss: (id: string) => void;
  toast: (item: Omit<ToastItem, "id">) => void;
  toasts: ToastItem[];
}

const [useToastContext, ToastProviderInternal] = create<ToastContext>("Toast");

export { useToastContext as useToast };

let nextId = 0;

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss(item.id));
    }, item.duration ?? 4000);

    return () => clearTimeout(timer);
  }, []);

  const borderColor =
    item.type === "error"
      ? "border-destructive"
      : item.type === "success"
        ? "border-success"
        : "border-primary";

  const bgColor =
    item.type === "error"
      ? "bg-destructive/10"
      : item.type === "success"
        ? "bg-success/10"
        : "bg-primary/10";

  const iconColor =
    item.type === "error"
      ? "text-destructive"
      : item.type === "success"
        ? "text-success"
        : "text-primary";

  const icon =
    item.type === "error" ? "!" : item.type === "success" ? "✓" : "i";

  return (
    <Animated.View
      className={`mx-page mb-2 overflow-hidden rounded-card border-2 ${borderColor} ${bgColor}`}
      style={{ opacity, transform: [{ translateY }] }}
    >
      <View className="flex-row items-start gap-3 px-4 py-3">
        <View
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-1 ${borderColor} ${iconColor}`}
        >
          <Text className={`font-black text-xs ${iconColor}`}>{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className={`font-bold font-sans text-sm ${iconColor}`}>
            {item.title}
          </Text>
          {item.message && (
            <Text className="mt-0.5 font-normal font-sans text-foreground text-xs leading-4">
              {item.message}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = String(++nextId);
    setToasts((prev) => [...prev, { ...item, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastProviderInternal value={{ toasts, toast, dismiss }}>
      {children}
      <View className="pointer-events-none absolute top-12 right-0 left-0 z-50">
        {toasts.map((t) => (
          <ToastCard item={t} key={t.id} onDismiss={dismiss} />
        ))}
      </View>
    </ToastProviderInternal>
  );
}
