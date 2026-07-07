"use client";

import { CalendarIcon, HouseIcon, PackageIcon, PlayCircleIcon, StethoscopeIcon, UserCircleIcon } from "lucide-react";

import { SidebarUserFooter } from "@/components/admin/sidebar-user-footer";
import { SidebarNavSection } from "@/components/admin/sidebar-nav-section";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@suwa/ui/components/sidebar";

export type DoctorSidebarRoute = "/" | "/doctor" | "/doctor/profile" | "/doctor/verification" | "/doctor/hub" | "/doctor/availability" | "/doctor/plans";

export function DoctorSidebar() {
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
                Doctor Hub
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
              icon: StethoscopeIcon,
              label: "Dashboard",
              to: "/doctor",
            },
            {
              icon: PlayCircleIcon,
              label: "Hub",
              to: "/doctor/hub",
            },
            {
              icon: UserCircleIcon,
              label: "Profile",
              to: "/doctor/profile",
            },
            {
              icon: CalendarIcon,
              label: "Availability",
              to: "/doctor/availability",
            },
            {
              icon: PackageIcon,
              label: "Plans",
              to: "/doctor/plans",
            },
          ]}
          label="Doctor"
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
