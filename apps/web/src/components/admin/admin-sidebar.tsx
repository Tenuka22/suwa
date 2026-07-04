"use client";

import { HouseIcon, LayoutDashboardIcon, StethoscopeIcon } from "lucide-react";

import { SidebarNavSection } from "@/components/admin/sidebar-nav-section";
import { SidebarUserFooter } from "@/components/admin/sidebar-user-footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@suwa/ui/components/sidebar";

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <img
              alt="Doca"
              className="size-8 rounded-md object-contain"
              height={32}
              src="/Logo.png"
              width={32}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2">
            <img
              alt="Doca"
              className="size-8 rounded-md object-contain"
              height={40}
              src="/Logo.png"
              width={40}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-semibold text-sm tracking-tight">
                Admin Console
              </span>
              <span className="truncate text-muted-foreground text-xs">Doca</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavSection
          items={[{ icon: HouseIcon, label: "Home", to: "/" }]}
          label="Main"
        />
        <SidebarNavSection
          items={[
            {
              icon: LayoutDashboardIcon,
              isActive: true,
              label: "Dashboard",
              to: "/admin",
            },
            {
              icon: StethoscopeIcon,
              label: "Doctors",
              to: "/admin",
              items: [
                {
                  label: "Doctor requests",
                  to: "/admin/doctor/requests",
                },
              ],
            },
          ]}
          label="Admin"
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
