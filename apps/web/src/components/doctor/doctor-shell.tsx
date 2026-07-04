"use client";

import type { ReactNode } from "react";

import { DoctorSidebar } from "@/components/doctor/doctor-sidebar";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@suwa/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@suwa/ui/components/sidebar";
import { TooltipProvider } from "@suwa/ui/components/tooltip";

export function DoctorShell({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const signedInAs = session?.user?.name ?? session?.user?.email ?? "Doctor";

  return (
    <TooltipProvider>
      <SidebarProvider >
        <DoctorSidebar />
        <SidebarInset>
          <div className="flex min-h-svh flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator className="h-4" orientation="vertical" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Doctor Hub</p>
                <p className="truncate text-muted-foreground text-sm">
                  Signed in as {signedInAs}
                </p>
              </div>
            </header>
            <main className="flex-1 p-4">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
