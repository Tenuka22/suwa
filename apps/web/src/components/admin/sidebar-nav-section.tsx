"use client";

import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@suwa/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@suwa/ui/components/sidebar";

export type AdminSidebarRoute = "/" | "/admin" | "/admin/doctor/requests";

export type AdminSidebarNavItem = {
  icon: LucideIcon;
  label: string;
  to: AdminSidebarRoute;
  isActive?: boolean;
  items?: {
    label: string;
    to: AdminSidebarRoute;
    isActive?: boolean;
  }[];
};

export function SidebarNavSection({
  items,
  label,
}: {
  items: AdminSidebarNavItem[];
  label: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items?.length) {
            return (
              <Collapsible
                className="group/collapsible"
                defaultOpen={item.isActive}
                key={item.label}
                render={<SidebarMenuItem />}
              >
                <CollapsibleTrigger
                  render={<SidebarMenuButton tooltip={item.label} />}
                >
                  <item.icon />
                  <span>{item.label}</span>
                  <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.label}>
                        <SidebarMenuSubButton
                          isActive={subItem.isActive}
                          render={<Link to={subItem.to} />}
                        >
                          <span>{subItem.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                isActive={item.isActive}
                render={<Link to={item.to} />}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
