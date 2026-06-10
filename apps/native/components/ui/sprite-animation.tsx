import { SpriteMascot } from "@/components/ui/sprite-mascot";

export type SpriteAction = "idle" | "happy" | "thinking" | "alert";

interface SpriteAnimationProps {
  action?: SpriteAction;
  size?: "sm" | "md" | "lg";
}

export function SpriteAnimation({ action, size }: SpriteAnimationProps) {
  return <SpriteMascot action={action} size={size} />;
}
