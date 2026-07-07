import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Banknote, CalendarDays, FolderOpen, LayoutDashboard, PencilLine, Stethoscope } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@suwa/ui/components/card";

export const Route = createFileRoute("/doctor/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (getUserRole(session?.user) === "pending-doctor") {
      throw redirect({ to: "/doctor/verification" });
    }
  },
  component: DoctorHub,
});

function DoctorHub() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="size-5 text-primary" />
          <h1 className="font-semibold text-2xl tracking-tight">Doctor Dashboard</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Manage your availability, plans, content, and payouts from one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="size-4 text-primary" />
              Hub
            </CardTitle>
            <CardDescription>Manage your content, channels, and uploads.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/doctor/hub" className="flex items-center gap-2">
                Open hub
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="size-4 text-primary" />
              Payments
            </CardTitle>
            <CardDescription>Connect your Stripe account and manage payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/doctor/payments" className="flex items-center gap-2">
                Open payments
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PencilLine className="size-4 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Update your public doctor profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/doctor/profile" className="flex items-center gap-2">
                Edit profile
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" />
              Availability
            </CardTitle>
            <CardDescription>Set the times patients can book you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/doctor/availability" className="flex items-center gap-2">
                Manage availability
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="size-4 text-primary" />
              Plans
            </CardTitle>
            <CardDescription>Adjust consultation pricing and plan details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/doctor/plans" className="flex items-center gap-2">
                Manage plans
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
