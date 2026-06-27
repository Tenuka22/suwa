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
  CalendarCheckIcon,
  ClockIcon,
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
          <div className="flex items-center justify-center">
            <span className="select-none font-semibold text-lg text-primary">
              Z
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Doctor Portal</span>
            <span className="text-muted-foreground text-xs">
              {APP_DISPLAY_NAME}
            </span>
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
            { icon: TagsIcon, label: "Plans", to: "/doctor/plans" },
            { icon: UserIcon, label: "Profile", to: "/doctor/profile" },
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
