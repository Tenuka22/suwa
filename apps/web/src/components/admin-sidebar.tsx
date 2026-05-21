"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@zen-doc/ui/components/sidebar";
import { HouseIcon, LayoutDashboardIcon, ShieldIcon } from "lucide-react";

import { SidebarNavSection } from "@/components/sidebar-nav-section";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";

export function AdminSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {state === "collapsed" ? (
          <div className="flex items-center justify-center py-1">
            <span className="select-none font-bold text-lg text-primary">
              Z
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-2 py-1.5">
            <span className="font-semibold text-sm">Admin Console</span>
            <span className="text-muted-foreground text-xs">ZenDoc</span>
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
            { icon: LayoutDashboardIcon, label: "Dashboard", to: "/admin" },
            {
              icon: ShieldIcon,
              label: "Doctor requests",
              to: "/admin/doc-requests",
              search: { page: 1, query: "" },
            },
            {
              icon: ShieldIcon,
              label: "Doctors",
              to: "/admin/doctors",
              search: { page: 1, query: "" },
            },
          ]}
          label="Secondary"
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
