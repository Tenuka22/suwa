import { Spinner } from "@heroui/react";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center py-8">
      <Spinner size="lg" />
    </div>
  );
}
