"use client";

import { useSidebar } from "@suwa/ui/components/sidebar";
import { UserCircleIcon } from "lucide-react";

import { authClient } from "@/utils/auth";

export function SidebarUserFooter() {
  const { state } = useSidebar();
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return null;
  }

  const isCollapsed = state === "collapsed";
  const name = session.user.name ?? "User";
  const role = (session.user as { role?: string }).role;
  const roleLabel = getRoleLabel(role);

  return (
    <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/90 bg-card/80 p-3 shadow-[0_10px_28px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <UserCircleIcon className="size-5" />
      </div>
      {isCollapsed ? null : (
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{name}</p>
          <p className="truncate text-muted-foreground text-xs">{roleLabel}</p>
        </div>
      )}
    </div>
  );
}

function getRoleLabel(role: string | undefined) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "tenant-admin") {
    return "Tenant Admin";
  }

  if (role === "doctor") {
    return "Doctor";
  }

  if (role === "pending-doctor") {
    return "Doctor (pending)";
  }

  return "User";
}
