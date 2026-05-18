import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@zen-doc/ui/components/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const user = useUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold">ZenDoc</span>
          <nav className="flex items-center gap-4 font-medium text-sm">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              search={{ page: 1 }}
              to="/doctor"
            >
              Doctor
            </Link>
            {user.isLoaded && user.user?.publicMetadata?.role === "admin" && (
              <Link
                className="text-muted-foreground transition-colors hover:text-foreground"
                search={{ page: 1, query: "" }}
                to="/admin"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user.isLoaded && user.user ? (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                Hi, {user.user.fullName ?? user.user.username}
              </span>
              <UserButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className={buttonVariants({ variant: "outline" })}
                to="/sign-in"
              >
                Sign In
              </Link>
              <Link
                className={buttonVariants({ variant: "default" })}
                to="/sign-up"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Web portal</CardTitle>
          <CardDescription>
            Doctor onboarding and admin approvals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {user.isLoaded && user.user
              ? `Signed in as ${user.user.fullName ?? user.user.username ?? "User"}`
              : "Not signed in."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
