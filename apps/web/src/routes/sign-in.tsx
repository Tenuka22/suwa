import { SignIn } from "@clerk/tanstack-react-start";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link className="font-semibold text-lg tracking-tight" to="/">
            {APP_DISPLAY_NAME}
          </Link>
          <p className="text-muted-foreground text-sm">
            Sign in to your account
          </p>
        </div>
        <div className="rounded-3xl border bg-card shadow-sm">
          <SignIn signUpUrl="/sign-up" />
        </div>
      </div>
    </div>
  );
}
