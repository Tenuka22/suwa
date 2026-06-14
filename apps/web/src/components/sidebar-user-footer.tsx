"use client";

import { UserButton, useUser } from "@clerk/tanstack-react-start";

import { useSidebar } from "@zen-doc/ui/components/sidebar";

export function SidebarUserFooter() {
  const { state } = useSidebar();
  const user = useUser();

  if (!(user.isLoaded && user.user)) {
    return null;
  }

  const isCollapsed = state === "collapsed";
  const name = user.user.fullName ?? user.user.username ?? "User";

  return (
    <div className="flex items-center gap-3 rounded-md">
      <UserButton />
      {isCollapsed ? null : (
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{name}</p>
          <p className="truncate text-muted-foreground text-xs">
            Doctor account
          </p>
        </div>
      )}
    </div>
  );
}
