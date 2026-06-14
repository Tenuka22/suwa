import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link className="font-semibold text-lg tracking-tight" to="/">
            ZenDoc
          </Link>
          <p className="text-muted-foreground text-sm">Create your account</p>
        </div>
        <div className="rounded-3xl border bg-card shadow-sm">
          <SignUp signInUrl="/sign-in" />
        </div>
      </div>
    </div>
  );
}
