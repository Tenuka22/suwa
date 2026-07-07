import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@suwa/ui/components/button";
import { Badge } from "@suwa/ui/components/badge";
import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import {
  ArrowRight,
  Calendar,
  FileText,
  Shield,
  Bell,
  Wallet,
  Users,
  Stethoscope,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: DoctorLanding,
});

const features = [
  {
    icon: Calendar,
    title: "Schedule management",
    description:
      "Set your availability, manage time slots, and let patients book sessions that work for you.",
  },
  {
    icon: Users,
    title: "Anonymous patient records",
    description:
      "Access patient histories and session notes under anonymized aliases - no personal data exposed.",
  },
  {
    icon: FileText,
    title: "Content hub",
    description:
      "Share videos, audio, and educational materials with patients. Organize by channel and control visibility.",
  },
  {
    icon: Bell,
    title: "Crisis alerts",
    description:
      "Get notified when a patient is in distress. Review, respond, and escalate with a full audit trail.",
  },
  {
    icon: Wallet,
    title: "Payments & subscriptions",
    description:
      "Set session fees, create subscription plans, and track payouts - all from your dashboard.",
  },
  {
    icon: BarChart3,
    title: "Analytics & insights",
    description:
      "Track session volume, patient engagement, and practice growth over time.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Sign up as a doctor, set up your professional profile, and get verified.",
  },
  {
    number: "02",
    title: "Set your practice",
    description:
      "Define your availability, session types, pricing, and the content you want to share.",
  },
  {
    number: "03",
    title: "Start seeing patients",
    description:
      "Accept bookings, conduct sessions, and manage your practice - all anonymously.",
  },
];

function DoctorLanding() {
  const { data: session } = authClient.useSession();
  const role = getUserRole(session?.user);

  const cta = (() => {
    if (!session) return { label: "Get Started", to: "/login" as const };
    if (role === "user") return { label: "Complete Setup", to: "/onboarding" as const };
    if (role === "pending-doctor") return { label: "Verification", to: "/doctor/verification" as const };
    if (role === "doctor") return { label: "Dashboard", to: "/doctor" as const };
    if (role === "admin") return { label: "Admin Panel", to: "/admin" as const };
    return { label: "Get Started", to: "/login" as const };
  })();

  const secondary = !session ? { label: "Sign In", to: "/login" as const } : null;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-24 pb-16 text-center sm:px-6 lg:pt-32 lg:pb-24">
        <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 text-sm font-medium">
          Doctor dashboard
        </Badge>
        <h1 className="max-w-4xl font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          Run your practice.{" "}
          <span className="text-primary">Keep it private.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Doca lets you manage your mental health practice from your browser - schedule,
          content, payments, and crisis response - while protecting patient anonymity.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="rounded-full px-8 text-base" render={<Link to={cta.to} />}>
            {cta.label}
            <ArrowRight className="ml-2 size-4" />
          </Button>
          {secondary && (
            <Button size="lg" variant="outline" className="rounded-full px-8 text-base" render={<Link to={secondary.to} />}>
              {secondary.label}
            </Button>
          )}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          For licensed therapists and doctors · No overhead · Built for privacy
        </p>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-bold text-3xl tracking-tight">
              Everything you need to run your practice
            </h2>
            <p className="mt-3 text-muted-foreground">
              From scheduling to crisis response - one dashboard.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 bg-background shadow-sm">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-bold text-3xl tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Three steps to start seeing patients on Doca.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-lg">
                  {step.number}
                </span>
                <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Doca */}
      <section className="border-t bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-bold text-3xl tracking-tight">Why Doca</h2>
            <p className="mt-3 text-muted-foreground">
              Built by therapists, for therapists.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <Shield className="size-5 text-primary" />
              <h3 className="font-semibold">Privacy-first</h3>
              <p className="text-sm text-muted-foreground">
                Patients stay anonymous. You get the clinical context you need without
                compromising their identity.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <Stethoscope className="size-5 text-primary" />
              <h3 className="font-semibold">No overhead</h3>
              <p className="text-sm text-muted-foreground">
                No paperwork, no admin hassle. Focus on care, not bureaucracy.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <Bell className="size-5 text-primary" />
              <h3 className="font-semibold">Crisis-ready</h3>
              <p className="text-sm text-muted-foreground">
                Built-in escalation paths and audit trails so you're never alone in an emergency.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border p-6">
              <Wallet className="size-5 text-primary" />
              <h3 className="font-semibold">Fair payouts</h3>
              <p className="text-sm text-muted-foreground">
                Set your own rates, offer subscriptions, and get paid on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="rounded-2xl bg-primary/5 px-6 py-16 sm:px-16">
            <Stethoscope className="mx-auto mb-6 size-10 text-primary" />
            <h2 className="font-bold text-3xl tracking-tight">
              Ready to start your practice?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Join Doca and start seeing patients - anonymously, securely, on your terms.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 text-base" render={<Link to={cta.to} />}>
                {cta.label}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          <p>&copy; {new Date().getFullYear()} Doca (ZenDoc). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

