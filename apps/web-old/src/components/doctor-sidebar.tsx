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
                Doctor Portal
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
          items={[
            { icon: HouseIcon, label: "Home", to: "/" },
            { icon: LayoutDashboardIcon, label: "Dashboard", to: "/doctor" },
          ]}
          label="Overview"
        />
        <SidebarNavSection
          items={[
            { icon: PlayCircleIcon, label: "Hub", to: "/doctor/hub" },
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
          label="Schedule"
        />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
