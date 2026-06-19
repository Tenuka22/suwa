export type SpriteAction =
  | "idle"
  | "happy"
  | "thinking"
  | "alert"
  | "sleepy"
  | "excited";

export function moodToAction(mood: string): SpriteAction {
  if (mood === "sleep" || mood === "sad") {
    return "alert";
  }
  if (mood === "yawn") {
    return "thinking";
  }
  if (mood === "happy") {
    return "happy";
  }
  return "idle";
}
