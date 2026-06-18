"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface SidebarContextType {
  open: boolean;
  state: "expanded" | "collapsed";
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return { state: "expanded" as const, open: true, toggleSidebar: () => {} };
  }
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const toggleSidebar = () => setOpen((prev) => !prev);
  const state = open ? ("expanded" as const) : ("collapsed" as const);
  const value = useMemo(
    () => ({ state, open, toggleSidebar }),
    [state, open, toggleSidebar]
  );
  return (
    <SidebarContext.Provider value={value}>
      <div
        className="group/sidebar-wrapper flex min-h-svh w-full"
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3rem",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      className={`relative flex w-full flex-1 flex-col bg-background ${className ?? ""}`}
      data-slot="sidebar-inset"
      {...props}
    />
  );
}

export function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const sidebar = useContext(SidebarContext);
  return (
    <button
      aria-label="Toggle Sidebar"
      className={`inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ${className ?? ""}`}
      data-slot="sidebar-trigger"
      onClick={() => sidebar?.toggleSidebar?.()}
      {...props}
    >
      <svg
        className="size-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 12h18M3 6h18M3 18h18"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
    </button>
  );
}

export function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { collapsible?: string }) {
  return (
    <div
      className={`group peer hidden md:block ${className ?? ""}`}
      data-collapsible="icon"
      data-side="left"
      data-slot="sidebar"
      data-state="expanded"
      data-variant="sidebar"
      {...props}
    >
      <div
        className="relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        data-slot="sidebar-gap"
      />
      <div
        className="fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=right]:right-0 data-[side=left]:left-0 group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l md:flex"
        data-side="left"
        data-slot="sidebar-container"
      >
        <div
          className="flex size-full flex-col bg-sidebar"
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SidebarHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`flex flex-col gap-2 p-2 ${className ?? ""}`}
      data-sidebar="header"
      data-slot="sidebar-header"
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden ${className ?? ""}`}
      data-sidebar="content"
      data-slot="sidebar-content"
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`flex flex-col gap-2 p-2 ${className ?? ""}`}
      data-sidebar="footer"
      data-slot="sidebar-footer"
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarRail({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      aria-label="Toggle Sidebar"
      className={`absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex ${className ?? ""}`}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      tabIndex={-1}
      title="Toggle Sidebar"
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`relative flex w-full min-w-0 flex-col p-2 ${className ?? ""}`}
      data-sidebar="group"
      data-slot="sidebar-group"
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarGroupLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`flex h-8 shrink-0 items-center rounded-md px-2 font-medium text-sidebar-foreground/70 text-xs outline-hidden ring-sidebar-ring group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 ${className ?? ""}`}
      data-sidebar="group-label"
      data-slot="sidebar-group-label"
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({
  className,
  children,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={`flex w-full min-w-0 flex-col gap-0 ${className ?? ""}`}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    >
      {children}
    </ul>
  );
}

export function SidebarMenuItem({
  className,
  children,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      className={`group/menu-item relative ${className ?? ""}`}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      {...props}
    >
      {children}
    </li>
  );
}

export function SidebarMenuButton({
  render,
  size = "default",
  tooltip,
  className,
  children,
  ...props
}: {
  render?: React.ReactElement;
  size?: string;
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
  isActive?: boolean;
  [key: string]: any;
}) {
  const sizeClass =
    size === "lg"
      ? "h-12 text-sm group-data-[collapsible=icon]:p-0!"
      : "h-8 text-sm";
  const Comp = render ? "a" : "button";

  return (
    <Comp
      className={`peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&_svg]:size-4 [&_svg]:shrink-0 ${sizeClass} ${className ?? ""}`}
      data-sidebar="menu-button"
      data-slot="sidebar-menu-button"
      {...props}
    >
      {children}
    </Comp>
  );
}
