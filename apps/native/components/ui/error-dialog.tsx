'use client';

import { useCallback, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";

export interface Action {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

interface ErrorDialogProps {
  actions?: Action[];
  message: string;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function ErrorDialog({
  open,
  onClose,
  title,
  message,
  actions,
}: ErrorDialogProps) {
  const defaultActions: Action[] = [
    { label: "Dismiss", onPress: onClose, variant: "secondary" },
  ];

  const buttons = actions && actions.length > 0 ? actions : defaultActions;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={open}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-page"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm overflow-hidden rounded-card border-2 border-border bg-card"
          onPress={() => {}}
        >
          <View className="gap-2 border-border border-b-2 px-6 py-5">
            <Text className="text-center font-black font-sans text-destructive text-xl">
              {title}
            </Text>
            <Text className="text-center font-normal font-sans text-foreground text-sm leading-5">
              {message}
            </Text>
          </View>

          <View className="gap-2 px-6 py-4">
            {buttons.map((action, i) => (
              <Button
                key={i}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
                variant={action.variant ?? "primary"}
              >
                {action.label}
              </Button>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface UseErrorDialogReturn {
  closeError: () => void;
  dialogProps: ErrorDialogProps;
  showError: (title: string, message: string, actions?: Action[]) => void;
}

export function useErrorDialog(): UseErrorDialogReturn {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actions, setActions] = useState<Action[] | undefined>();

  const showError = useCallback((t: string, m: string, a?: Action[]) => {
    setTitle(t);
    setMessage(m);
    setActions(a);
    setOpen(true);
  }, []);

  const closeError = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    dialogProps: { open, onClose: closeError, title, message, actions },
    showError,
    closeError,
  };
}
