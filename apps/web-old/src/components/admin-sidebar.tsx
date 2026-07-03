"use client";

import { APP_DISPLAY_NAME } from "@suwa/app-info";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@suwa/ui/components/sidebar";
import {
  CalendarDaysIcon,
  FileTextIcon,
  HouseIcon,
  LayoutDashboardIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";

import { SidebarNavSection } from "@/components/sidebar-nav-section";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";

export function AdminSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar className="p-2" collapsible="icon" variant="floating">
      <SidebarHeader className="p-3">
        {state === "collapsed" ? (
          <div className="flex items-center justify-center">
            <img
              alt={APP_DISPLAY_NAME}
              className="size-8 rounded-xl object-contain"
              height={32}
              src="/Logo.png"
              width={32}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[1.2rem] border border-border/90 bg-card/80 p-2 shadow-[0_10px_28px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md">
            <img
              alt={APP_DISPLAY_NAME}
              className="size-10 rounded-xl object-contain"
              height={40}
              src="/Logo.png"
              width={40}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-semibold text-sm tracking-tight">
                Admin Console
              </span>
              <span className="truncate text-muted-foreground text-xs">
                {APP_DISPLAY_NAME}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="px-1">
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
            {
              icon: CalendarDaysIcon,
              label: "Sessions",
              to: "/admin/sessions",
              search: { page: 1 },
            },
            {
              icon: UserRoundIcon,
              label: "Patients",
              to: "/admin/patients",
              search: { page: 1 },
            },
            {
              icon: FileTextIcon,
              label: "Plans",
              to: "/admin/plans",
              search: { page: 1 },
            },
          ]}
          label="Secondary"
        />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
