"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@suwa/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

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
  const buttonSize = "default";

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
