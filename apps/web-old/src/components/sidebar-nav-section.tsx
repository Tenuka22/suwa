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
    <SidebarGroup className="gap-1 px-2 py-3">
      <SidebarGroupLabel className="px-3 font-medium text-[0.68rem] text-muted-foreground uppercase tracking-[0.16em]">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              className="h-10 rounded-full px-3 text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
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
