import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent } from "@suwa/ui/components/card";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { authClient, setOnboardingRole } from "@/utils/auth";
import { queryClient } from "@/utils/orpc";
import { buildHeadFromKey } from "./__root";

export const Route = createFileRoute("/onboarding")({
  head: () => buildHeadFromKey("web:onboarding"),
  component: OnboardingPage,
});

type OnboardingRole = "tenant" | "doctor";
type OnboardingActionState = "idle" | "submitting" | "success" | "error";

function OnboardingPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [role, setRole] = useState<OnboardingRole | null>(null);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState<OnboardingActionState>("idle");
  const isActionBusy =
    actionState === "submitting" || actionState === "success";

  useEffect(() => {
    if (isPending) {
      return;
    }
    if (!session) {
      navigate({ to: "/sign-in" });
      return;
    }
    const currentRole = session.user?.role;
    if (currentRole && currentRole !== "user") {
      navigate({ to: "/" });
    }
  }, [session, isPending, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!role || isActionBusy) {
      return;
    }
    setError("");
    setActionState("submitting");
    try {
      await setOnboardingRole(
        role === "doctor" ? "pending-doctor" : "tenant-admin"
      );
      await queryClient.invalidateQueries();
      setActionState("success");
      navigate({ to: "/" });
    } catch (err) {
      setActionState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleRoleSelect = (nextRole: OnboardingRole) => {
    if (isActionBusy) {
      return;
    }
    setRole(nextRole);
    setError("");
    if (actionState === "error") {
      setActionState("idle");
    }
  };

  const roleNote = role
    ? {
        doctor:
          "Your doctor profile may need approval before all provider tools are available.",
        tenant:
          "You can create your organization and configure clinic settings after this step.",
      }[role]
    : "Select a role to personalize your dashboard, permissions, and setup checklist.";
  let submitLabel = "Select a role to continue";
  if (actionState === "submitting") {
    submitLabel = "Setting up...";
  } else if (actionState === "success") {
    submitLabel = "Opening your dashboard...";
  } else if (role) {
    submitLabel = `Continue as ${role === "tenant" ? "Tenant admin" : "Doctor"}`;
  }

  return (
    <div className="flex size-full flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="relative hidden bg-muted md:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-muted" />
              <div className="relative flex size-full flex-col justify-between gap-10 p-10">
                <Link className="font-semibold text-lg tracking-tight" to="/">
                  {APP_DISPLAY_NAME}
                </Link>
                <div className="flex flex-col gap-5">
                  <div className="w-fit rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/15">
                    <BuildingIcon />
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-bold text-3xl tracking-tight">
                      Build your workspace around how you deliver care.
                    </h2>
                    <p className="text-balance text-muted-foreground text-sm leading-6">
                      Your role helps {APP_DISPLAY_NAME} prepare the right
                      tools, permissions, and next steps before you enter the
                      app.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <InfoItem>Secure patient and appointment workflows</InfoItem>
                  <InfoItem>
                    Role-aware dashboards for clinics and providers
                  </InfoItem>
                  <InfoItem>Guided setup that only takes a moment</InfoItem>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col items-center gap-2 text-center md:hidden">
                <Link className="font-semibold text-lg tracking-tight" to="/">
                  {APP_DISPLAY_NAME}
                </Link>
                <p className="text-muted-foreground text-sm">
                  Finish onboarding
                </p>
              </div>
              <form
                aria-busy={isActionBusy}
                className="flex flex-col gap-6"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="font-bold text-2xl">Set up your account</h1>
                  <p className="text-balance text-muted-foreground text-sm">
                    Choose the role that best describes how you&apos;ll use{" "}
                    {APP_DISPLAY_NAME}.
                  </p>
                </div>
                <div className="grid gap-3">
                  <RoleOption
                    active={role === "tenant"}
                    description="Create a clinic workspace, invite staff, and manage practice operations."
                    disabled={isActionBusy}
                    icon={<ClinicIcon />}
                    label="Clinic or practice owner"
                    meta="Tenant admin"
                    onClick={() => handleRoleSelect("tenant")}
                  />
                  <RoleOption
                    active={role === "doctor"}
                    description="Join as a provider to manage your care schedule and patient activity."
                    disabled={isActionBusy}
                    icon={<DoctorIcon />}
                    label="Doctor or care provider"
                    meta="Pending doctor"
                    onClick={() => handleRoleSelect("doctor")}
                  />
                </div>
                <div className="rounded-xl border bg-muted/40 p-4 text-muted-foreground text-sm">
                  {roleNote}
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  className="w-full"
                  disabled={isActionBusy || !role}
                  type="submit"
                >
                  {submitLabel}
                </Button>
              </form>
              <p className="px-6 text-center text-muted-foreground text-xs">
                By clicking continue, you agree to our{" "}
                <a className="underline underline-offset-4" href="/terms">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="underline underline-offset-4" href="/privacy">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-background/70 p-3 text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur">
      <CheckIcon />
      <span>{children}</span>
    </div>
  );
}

function RoleOption({
  active,
  description,
  disabled = false,
  icon,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
      } disabled:pointer-events-none disabled:opacity-60`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        className={`rounded-xl p-2 [&_svg]:text-current ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </span>
      <span className="grid flex-1 gap-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-semibold">{label}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {meta}
          </span>
        </span>
        <span className="text-muted-foreground text-sm leading-5">
          {description}
        </span>
      </span>
    </button>
  );
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-8 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        d="m4.5 12.75 6 6 9-13.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClinicIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DoctorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
