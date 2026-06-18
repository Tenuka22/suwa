"use client";

import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface TagProps {
  children: ReactNode;
  variant?: "success" | "warning" | "destructive" | "muted" | "primary" | "secondary";
  shape?: "square" | "pill";
  className?: string;
}

export function Tag({
  children,
  variant = "muted",
  shape = "pill",
  className,
}: TagProps) {
  const variantStyles = {
    success: "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400",
    warning: "bg-yellow-100 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800/50 dark:text-yellow-400",
    destructive: "bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400",
    muted: "bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-800/30 dark:border-zinc-700/50 dark:text-zinc-400",
    primary: "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300",
    secondary: "bg-zinc-50 border-zinc-100 text-zinc-700 dark:bg-zinc-800/10 dark:border-zinc-700/20 dark:text-zinc-300",
  };

  const roundedClass = shape === "pill" ? "rounded-full" : "rounded-md";

  return (
    <View
      className={`border px-2.5 py-1 items-center justify-center self-start ${roundedClass} ${variantStyles[variant]} ${className ?? ""}`.trim()}
    >
      <Text className="font-sans text-[10px] font-semibold uppercase tracking-wider text-current">
        {children}
      </Text>
    </View>
  );
}
