import { useNavigate } from "@tanstack/react-router";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/utils/auth";
import { Button } from "@suwa/ui/components/button";
import { Input } from "@suwa/ui/components/input";
import { Card, CardContent } from "@suwa/ui/components/card";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message ?? signInError.statusText);
    } else {
      navigate({ to: "/" });
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { data } = await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    });
    if (data?.url) {
      window.location.href = data.url;
    }
    setGoogleLoading(false);
  };

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
        <Card className="rounded-3xl border bg-card shadow-sm">
          <CardContent className="p-6">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
              </div>
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              variant="outline"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Redirecting..." : "Sign in with Google"}
            </Button>
            <p className="mt-4 text-center text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link className="font-medium text-primary hover:underline" to="/sign-up">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
