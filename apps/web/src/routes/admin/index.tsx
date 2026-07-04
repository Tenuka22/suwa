import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center rounded-lg border bg-card p-8 text-center">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">Admin Console</p>
        <h1 className="font-semibold text-3xl tracking-tight">Admin Panel</h1>
      </div>
    </div>
  );
}
