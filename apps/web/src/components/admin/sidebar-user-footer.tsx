"use client";

import { UserCircleIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { getUserRole, type UserRole } from "@/lib/user-role";
import { useSidebar } from "@suwa/ui/components/sidebar";

function getRoleLabel(role: UserRole | undefined) {
  if (role === "admin") return "Admin";
  if (role === "tenant-admin") return "Tenant Admin";
  if (role === "doctor") return "Doctor";
  if (role === "pending-doctor") return "Doctor (pending)";
  return "User";
}

export function SidebarUserFooter() {
  const { state } = useSidebar();
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return null;
  }

  const isCollapsed = state === "collapsed";
  const name = session.user.name ?? "User";
  const roleLabel = getRoleLabel(getUserRole(session.user));

  return (
    <div className="flex items-center gap-2 p-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UserCircleIcon />
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
