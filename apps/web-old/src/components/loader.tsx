import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex h-full flex-row items-center justify-center gap-2 py-8">
      <Loader2 className="animate-spin" />
      <span>Loading</span>
    </div>
  );
}
