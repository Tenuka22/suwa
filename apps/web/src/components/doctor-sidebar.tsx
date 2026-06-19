import { UserButton, useUser } from "@clerk/tanstack-react-start";
import type { Selection } from "@heroui/react";
import {
  Header,
  Label,
  ListBox,
  Separator,
  Surface,
  Tooltip,
} from "@heroui/react";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheckIcon,
  ClockIcon,
  HouseIcon,
  LayoutDashboardIcon,
  PlayCircleIcon,
  TagsIcon,
  UserIcon,
} from "lucide-react";
import { useCallback, useMemo } from "react";

interface DoctorSidebarProps {
  collapsed: boolean;
}

const mainNav = [
  { id: "/", icon: HouseIcon, label: "Home" },
  { id: "/doctor", icon: LayoutDashboardIcon, label: "Dashboard" },
];

const doctorNav = [
  { id: "/doctor/hub", icon: PlayCircleIcon, label: "Hub" },
  { id: "/doctor/sessions", icon: CalendarCheckIcon, label: "Sessions" },
  { id: "/doctor/availability", icon: ClockIcon, label: "Availability" },
  { id: "/doctor/plans", icon: TagsIcon, label: "Plans" },
  { id: "/doctor/profile", icon: UserIcon, label: "Profile" },
];

function NavItem({
  item,
  collapsed,
}: {
  item: { id: string; icon: React.ElementType; label: string };
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <ListBox.Item
      className={
        collapsed
          ? "flex justify-center rounded-lg px-0 py-2"
          : "flex items-center gap-3 rounded-lg px-3 py-2"
      }
      id={item.id}
      key={item.id}
      textValue={item.label}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <Label className="cursor-pointer">{item.label}</Label>}
    </ListBox.Item>
  );

  if (collapsed) {
    return (
      <Tooltip.Root>
        <Tooltip.Trigger className="w-full">{content}</Tooltip.Trigger>
        <Tooltip.Content placement="right">{item.label}</Tooltip.Content>
      </Tooltip.Root>
    );
  }

  return content;
}

export function DoctorSidebar({ collapsed }: DoctorSidebarProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useUser();

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      const key = keys === "all" ? undefined : [...keys][0];
      if (key) {
        navigate({ to: key as string });
      }
    },
    [navigate]
  );

  const selectedKeys = useMemo(() => {
    const activeKey = [...mainNav, ...doctorNav]
      .slice()
      .reverse()
      .find((item) => pathname.startsWith(item.id))?.id;
    return activeKey ? [activeKey] : [];
  }, [pathname]);

  return (
    <div className={["relative", collapsed ? "w-16" : "w-60"].join(" ")}>
      <Surface
        className={[
          "fixed inset-0 flex h-screen flex-col border-border border-r transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-60",
        ].join(" ")}
      >
        <div
          className={[
            "flex shrink-0 items-center gap-2.5 px-3 py-4",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <img className="h-12 w-auto" src="/Logo.png" />
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-foreground text-sm leading-tight">
                Doctor Portal
              </span>
              <span className="truncate text-muted text-xs leading-snug">
                {APP_DISPLAY_NAME}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <ListBox
            aria-label="Doctor navigation"
            className="border-none bg-transparent p-0 shadow-none"
            onSelectionChange={handleSelectionChange}
            selectedKeys={selectedKeys}
            selectionMode="single"
          >
            <ListBox.Section>
              {!collapsed && (
                <Header className="mb-1 px-3 font-medium text-muted text-xs uppercase tracking-wider">
                  Main
                </Header>
              )}
              {mainNav.map((item) => (
                <NavItem collapsed={collapsed} item={item} key={item.id} />
              ))}
            </ListBox.Section>

            <Separator className="my-2" />

            <ListBox.Section>
              {!collapsed && (
                <Header className="mb-1 px-3 font-medium text-muted text-xs uppercase tracking-wider">
                  Doctor
                </Header>
              )}
              {doctorNav.map((item) => (
                <NavItem collapsed={collapsed} item={item} key={item.id} />
              ))}
            </ListBox.Section>
          </ListBox>
        </div>

        <Separator />

        <div
          className={[
            "flex shrink-0 items-center gap-3 px-3 py-4",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <UserButton />
          {!collapsed && user && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground text-sm leading-tight">
                {user.fullName ?? user.primaryEmailAddress?.emailAddress}
              </span>
              <span className="truncate text-muted text-xs leading-snug">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}
