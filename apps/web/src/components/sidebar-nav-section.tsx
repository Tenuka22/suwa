"use client";

import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/sidebar-context";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  search?: Record<string, string | number>;
  to: string;
}

export function SidebarNavSection({
  items,
  label,
}: {
  items: SidebarNavItem[];
  label: string;
}) {
  const { state } = useSidebar();
  const buttonSize = state === "collapsed" ? "default" : "lg";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              render={<Link search={item.search} to={item.to} />}
              size={buttonSize}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
