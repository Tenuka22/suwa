import {
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";

interface ScreenBottomBarAction {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface ScreenBottomBarProps {
  actions?: ScreenBottomBarAction[];
  children?: ReactNode;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onToggleAction?: (value: string) => void;
  selectedValues?: string[];
}

export const ScreenBottomBar = ({
  actions,
  children,
  hasNext,
  hasPrev,
  onNextPage,
  onPrevPage,
  onToggleAction,
  selectedValues,
}: ScreenBottomBarProps) => (
  <View className="absolute right-page bottom-page left-page">
    <View className="flex-row gap-2 rounded-card border-2 border-border bg-card p-3 shadow-lg">
      {children ? (
        children
      ) : (
        <>
          <View className="flex-1 flex-row overflow-hidden rounded-control border-2 border-border bg-background">
            {(actions ?? []).map(({ icon: Icon, label, value }) => {
              const isActive = selectedValues?.includes(value) ?? false;

              return (
                <Pressable
                  className="flex-1 border-border border-r-2 last:border-r-0"
                  key={value}
                  onPress={() => {
                    onToggleAction?.(value);
                  }}
                >
                  {({ pressed }) => (
                    <View
                      className={`h-14 flex-1 items-center justify-center gap-1 px-2 py-3 ${isActive ? "bg-orange-500" : pressed ? "bg-orange-500/10" : "bg-background"}`}
                    >
                      <Icon
                        color={isActive ? "#ffffff" : "#f97316"}
                        size={14}
                      />
                      <Text
                        className={`text-center font-bold font-sans text-[10px] uppercase tracking-[0.12em] ${isActive ? "text-white" : "text-orange-500"}`}
                      >
                        {label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-2">
            <IconButton
              disabled={!hasPrev}
              icon={ChevronLeft}
              iconSize={20}
              onPress={() => onPrevPage?.()}
            />
            <IconButton
              disabled={!hasNext}
              icon={ChevronRight}
              iconSize={20}
              onPress={() => onNextPage?.()}
            />
          </View>
        </>
      )}
    </View>
  </View>
);
