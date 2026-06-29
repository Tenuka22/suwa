import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { Badge } from "@suwa/ui/components/badge";
import { Button, buttonVariants } from "@suwa/ui/components/button";
import { Card, CardContent } from "@suwa/ui/components/card";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  ShieldIcon,
  StethoscopeIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";

import { authClient } from "@/utils/auth";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const user = session?.user;
  const name = user?.name ?? user?.email;
  const role = (user as { role?: string } | undefined)?.role;
  const signedIn = Boolean(session);
  const firstName = getFirstName(name);
  const roleDetails = getRoleDetails(role, signedIn, firstName);

  const handleSignOut = async () => {
    setSignOutError("");
    setIsSigningOut(true);

    try {
      await authClient.signOut();
      navigate({ to: "/" });
    } catch {
      setSignOutError("Sign out did not finish. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 border-border/70 border-b bg-[linear-gradient(90deg,color-mix(in_oklch,var(--card)_60%,transparent)_1px,transparent_1px),linear-gradient(180deg,color-mix(in_oklch,var(--card)_50%,transparent)_1px,transparent_1px)] bg-[size:44px_44px] opacity-50"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex min-h-16 items-center justify-between gap-4 rounded-[1.4rem] border border-border/90 bg-card/80 px-4 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4">
            <Link className="flex items-center" to="/">
              <img
                alt={APP_DISPLAY_NAME}
                className="size-10 rounded-xl object-contain"
                height={40}
                src="/Logo.png"
                width={40}
              />
            </Link>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <nav
              aria-label="Workspace navigation"
              className="hidden items-center gap-1 md:flex"
            >
              {role === "doctor" || role === "pending-doctor" ? (
                <Link
                  className="rounded-full px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  search={{ page: 1 }}
                  to="/doctor"
                >
                  Doctor
                </Link>
              ) : null}
              {role === "tenant-admin" ? (
                <Link
                  className="rounded-full px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  to="/tenant"
                >
                  Tenant
                </Link>
              ) : null}
              {role === "admin" ? (
                <Link
                  className="rounded-full px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  search={{ page: 1, query: "" }}
                  to="/admin"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {signedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden flex-row items-center justify-center gap-2 text-right sm:flex">
                  <p className="font-medium text-foreground text-sm leading-none">
                    {firstName}
                  </p>
                  -
                  <p className="text-muted-foreground text-xs capitalize">
                    {formatRole(role)}
                  </p>
                </div>
                <Button
                  className="rounded-full border-border bg-card px-4 text-foreground hover:bg-muted"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  size="sm"
                  variant="outline"
                >
                  {isSigningOut ? "Signing out" : "Sign out"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  className={buttonVariants({
                    className:
                      "rounded-full border-border bg-card px-4 text-foreground hover:bg-muted",
                    size: "sm",
                    variant: "outline",
                  })}
                  to="/sign-in"
                >
                  Sign in
                </Link>
                <Link
                  className={buttonVariants({
                    className:
                      "rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90",
                    size: "sm",
                    variant: "default",
                  })}
                  to="/sign-up"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>
        {signOutError ? (
          <p className="mt-3 text-right text-destructive text-sm">
            {signOutError}
          </p>
        ) : null}

        <main className="flex flex-1 items-center justify-center py-12 sm:py-16 lg:py-20">
          <section className="grid w-full gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="flex flex-col gap-7">
              <div className="flex flex-wrap gap-2">
                <Badge className="h-7 rounded-full bg-primary px-3 text-primary-foreground">
                  Doctor onboarding
                </Badge>
                <Badge className="h-7 rounded-full border-border bg-card/70 px-3 text-muted-foreground">
                  Admin review
                </Badge>
              </div>

              <div className="flex flex-col gap-5">
                <h1 className="max-w-[11ch] text-balance font-semibold text-[clamp(3rem,6.4vw,5.9rem)] leading-[0.98] tracking-[-0.055em]">
                  One calm desk for care operations.
                </h1>
                <p className="max-w-[58ch] text-base text-muted-foreground leading-8 sm:text-lg">
                  {APP_DISPLAY_NAME} brings doctor setup, tenant admin, schedule
                  readiness, and approval work into a quieter healthcare
                  workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <PrimaryGatewayAction
                  isPending={isPending}
                  role={role}
                  signedIn={signedIn}
                />
                {signedIn ? (
                <></>
                ) : (
                  <Link
                    className={buttonVariants({
                      className:
                        "h-12 rounded-full border-border bg-card/70 px-5 text-foreground hover:bg-muted",
                      size: "lg",
                      variant: "outline",
                    })}
                    to="/sign-in"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-4 lg:pl-4" id="quick-access">
              <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_12%,transparent)] backdrop-blur-md">
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <Badge className="h-7 rounded-full bg-primary px-3 text-primary-foreground">
                      Quick access
                    </Badge>
                    <div className="rounded-full border border-border bg-background p-3 text-muted-foreground">
                      <UsersIcon className="size-5" />
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.16em]">
                      {isPending ? "Checking access" : "Signed in as"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-semibold text-3xl text-foreground tracking-tight">
                        {isPending ? "One moment" : roleDetails.name}
                      </h2>
                      <Badge className="h-6 rounded-full bg-accent px-3 text-accent-foreground capitalize">
                        {isPending ? "Loading" : roleDetails.roleLabel}
                      </Badge>
                    </div>
                    <p className="max-w-[46ch] text-muted-foreground text-sm leading-6">
                      {isPending
                        ? "We are checking your session before opening the right workspace."
                        : roleDetails.description}
                    </p>
                  </div>

                  <div className="mt-7 grid gap-3">
                    <QuickAccessLinks
                      isPending={isPending}
                      role={role}
                      signedIn={signedIn}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function PrimaryGatewayAction({
  isPending,
  role,
  signedIn,
}: {
  isPending: boolean;
  role?: string;
  signedIn: boolean;
}) {
  const className = buttonVariants({
    className:
      "h-12 rounded-full bg-primary px-5 text-primary-foreground shadow-[0_10px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_34px_color-mix(in_oklch,var(--primary)_22%,transparent)]",
    size: "lg",
    variant: "default",
  });

  if (isPending) {
    return (
      <Button className={className} disabled>
        Checking access
      </Button>
    );
  }

  if (!signedIn) {
    return (
      <Link className={className} to="/sign-up">
        Create account
        <ArrowRightIcon className="size-4" />
      </Link>
    );
  }

  if (role === "admin") {
    return (
      <Link className={className} search={{ page: 1, query: "" }} to="/admin">
        Open admin console
        <ArrowRightIcon className="size-4" />
      </Link>
    );
  }

  if (role === "doctor" || role === "pending-doctor") {
    return (
      <Link className={className} search={{ page: 1 }} to="/doctor">
        Open doctor portal
        <ArrowRightIcon className="size-4" />
      </Link>
    );
  }

  if (role === "tenant-admin") {
    return (
      <Link className={className} to="/tenant">
        Open tenant area
        <ArrowRightIcon className="size-4" />
      </Link>
    );
  }

  return (
    <Link className={className} to="/onboarding">
      Finish setup
      <ArrowRightIcon className="size-4" />
    </Link>
  );
}

function QuickAccessLinks({
  isPending,
  role,
  signedIn,
}: {
  isPending: boolean;
  role?: string;
  signedIn: boolean;
}) {
  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-12 rounded-2xl bg-border/60" />
        <div className="h-12 rounded-2xl bg-border/40" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className={quickLinkClass} to="/sign-up">
          <UsersIcon className="size-4" />
          Create account
        </Link>
        <Link className={quickLinkClass} to="/sign-in">
          <ShieldIcon className="size-4" />
          Sign in
        </Link>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className={quickLinkClass}
          search={{ page: 1, query: "" }}
          to="/admin"
        >
          <ShieldIcon className="size-4" />
          Review queue
        </Link>
        <Link
          className={quickLinkClass}
          search={{ page: 1, query: "" }}
          to="/admin/doctors"
        >
          <StethoscopeIcon className="size-4" />
          Doctors
        </Link>
      </div>
    );
  }

  if (role === "doctor" || role === "pending-doctor") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className={quickLinkClass} search={{ page: 1 }} to="/doctor">
          <StethoscopeIcon className="size-4" />
          Doctor area
        </Link>
        <Link className={quickLinkClass} to="/doctor/availability">
          <CalendarClockIcon className="size-4" />
          Availability
        </Link>
      </div>
    );
  }

  if (role === "tenant-admin") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className={quickLinkClass} to="/tenant">
          <CalendarClockIcon className="size-4" />
          Tenant area
        </Link>
        <Link className={quickLinkClass} to="/tenant/create">
          <StethoscopeIcon className="size-4" />
          Register hospital
        </Link>
      </div>
    );
  }

  return (
    <Link className={quickLinkClass} to="/onboarding">
      <UsersIcon className="size-4" />
      Choose workspace
    </Link>
  );
}

const quickLinkClass = buttonVariants({
  className:
    "h-12 justify-start rounded-2xl border bg-background/72 px-4 text-foreground hover:border-secondary/40 hover:bg-muted",
  variant: "outline",
});

function getRoleDetails(
  role: string | undefined,
  signedIn: boolean,
  name: string
) {
  if (!signedIn) {
    return {
      description: "Create an account to access doctor and tenant tools.",
      name: "Guest",
      roleLabel: "Visitor",
    };
  }

  if (role === "admin") {
    return {
      description:
        "Jump into approvals, doctor review, and platform operations.",
      name,
      roleLabel: "Admin",
    };
  }

  if (role === "doctor") {
    return {
      description: "Manage your profile, plans, files, and availability.",
      name,
      roleLabel: "Doctor",
    };
  }

  if (role === "pending-doctor") {
    return {
      description:
        "Finish your doctor setup so admins can approve your profile.",
      name,
      roleLabel: "Pending doctor",
    };
  }

  if (role === "tenant-admin") {
    return {
      description: "Manage hospitals, doctors, clinics, and tenant readiness.",
      name,
      roleLabel: "Tenant admin",
    };
  }

  return {
    description: "Choose a workspace so Suwa can open the right tools for you.",
    name,
    roleLabel: formatRole(role),
  };
}

function getFirstName(name: string | null | undefined) {
  if (!name) {
    return "Teammate";
  }

  return name.split("@")[0]?.split(" ")[0] ?? name;
}

function formatRole(role: string | undefined) {
  if (!role) {
    return "Care team";
  }

  return role.split("-").join(" ");
}
