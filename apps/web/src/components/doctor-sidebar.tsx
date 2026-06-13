"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@zen-doc/ui/components/sidebar";
import {
  BuildingIcon,
  CalendarCheckIcon,
  ClockIcon,
  DollarSignIcon,
  HouseIcon,
  LayoutDashboardIcon,
  PlayCircleIcon,
  TagsIcon,
  UserIcon,
} from "lucide-react";

import { SidebarNavSection } from "@/components/sidebar-nav-section";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";

export function DoctorSidebar() {
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
          <div className="flex flex-col gap-1 px-2 py-1">
            <span className="font-semibold text-sm">Doctor Portal</span>
            <span className="text-muted-foreground text-xs">ZenDoc</span>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavSection
          items={[
            { icon: HouseIcon, label: "Home", to: "/" },
          ]}
          label="Main"
        />
        <SidebarNavSection
          items={[
            { icon: LayoutDashboardIcon, label: "Dashboard", to: "/doctor" },
            {
              icon: PlayCircleIcon,
              label: "Hub",
              to: "/doctor/hub",
            },
            {
              icon: CalendarCheckIcon,
              label: "Sessions",
              to: "/doctor/sessions",
            },
            {
              icon: ClockIcon,
              label: "Availability",
              to: "/doctor/availability",
            },
            { icon: DollarSignIcon, label: "Credits", to: "/doctor/credits" },
            { icon: TagsIcon, label: "Plans", to: "/doctor/plans" },
            { icon: UserIcon, label: "Profile", to: "/doctor/profile" },
          ]}
          label="Secondary"
        />
        <SidebarNavSection
          items={[
            {
              icon: BuildingIcon,
              label: "Hospitals",
              to: "/tenant",
            },
          ]}
          label="Tenant"
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
