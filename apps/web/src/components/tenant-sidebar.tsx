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
import { useParams } from "@tanstack/react-router";
import {
  BuildingIcon,
  CalendarCheckIcon,
  ChartBarIcon,
  HouseIcon,
  LayoutDashboardIcon,
  StethoscopeIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import { SidebarNavSection } from "@/components/sidebar-nav-section";
import { SidebarUserFooter } from "@/components/sidebar-user-footer";

export function TenantSidebar() {
  const { state } = useSidebar();
  const { tenantId } = useParams({ strict: false }) as { tenantId?: string };
  const base = tenantId ? `/tenant/${tenantId}` : "/tenant";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {state === "collapsed" ? (
          <div className="flex items-center justify-center">
            <BuildingIcon className="size-4 text-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Hospital Portal</span>
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
        {tenantId ? (
          <SidebarNavSection
            items={[
              {
                icon: LayoutDashboardIcon,
                label: "Dashboard",
                to: `${base}/`,
              },
              {
                icon: UsersIcon,
                label: "Doctors",
                to: `${base}/doctors`,
              },
              {
                icon: CalendarCheckIcon,
                label: "Attendance",
                to: `${base}/attendance`,
              },
              {
                icon: StethoscopeIcon,
                label: "Clinics",
                to: `${base}/clinics`,
              },
              {
                icon: UserPlusIcon,
                label: "Invite Doctor",
                to: `${base}/invite`,
              },
              {
                icon: ChartBarIcon,
                label: "Settings",
                to: `${base}/settings`,
              },
            ]}
            label="Hospital"
          />
        ) : (
          <SidebarNavSection
            items={[
              {
                icon: BuildingIcon,
                label: "My Hospitals",
                to: "/tenant",
              },
            ]}
            label="Tenant"
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
