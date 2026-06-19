import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { Button, Chip } from "@heroui/react";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const user = useUser();
  const navigate = useNavigate();
  const name = user.user?.fullName ?? user.user?.username;

  return (
    <div className="size-full flex-1">
      <header className="sticky top-0 z-50 border-border/40 border-b bg-background/20 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-8">
          <img className="size-12" src="/Logo.png" />
          <nav className="hidden items-center gap-2 sm:flex">
            {user.isLoaded && user.user && (
              <Button
                onPress={() => navigate({ to: "/doctor", search: { page: 1 } })}
                size="sm"
                variant="outline"
              >
                Doctor
              </Button>
            )}
            {user.isLoaded && user.user && (
              <Button
                onPress={() => navigate({ to: "/tenant" })}
                size="sm"
                variant="outline"
              >
                Tenant
              </Button>
            )}
            {user.isLoaded && user.user?.publicMetadata?.role === "admin" && (
              <Button
                onPress={() =>
                  navigate({ to: "/admin", search: { page: 1, query: "" } })
                }
                size="sm"
                variant="outline"
              >
                Admin
              </Button>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user.isLoaded && user.user ? (
              <>
                <span className="hidden text-muted-foreground text-sm sm:inline">
                  {name}
                </span>
                <UserButton />
              </>
            ) : (
              <>
                <Button
                  onPress={() => navigate({ to: "/sign-in" })}
                  size="sm"
                  variant="tertiary"
                >
                  Sign In
                </Button>
                <Button onPress={() => navigate({ to: "/sign-up" })} size="sm">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="size-full flex-1">
        <section className="bg-gradient-to-b from-accent/5 via-accent/[2%] to-background">
          <div className="flex flex-col items-center gap-3 px-6 pt-20 text-center">
            <Chip color="accent" variant="soft">
              Doctor Onboarding & Admin Platform
            </Chip>
            <h1 className="max-w-3xl pt-3 font-light text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              Welcome to {APP_DISPLAY_NAME}
            </h1>
            <p className="max-w-2xl font-light text-lg text-muted-foreground sm:text-xl">
              Streamlined doctor onboarding, credential management, and
              administrative oversight for modern telehealth practices.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {user.isLoaded && user.user ? (
                <Button
                  onPress={() =>
                    navigate({
                      to:
                        user.user.publicMetadata?.role === "admin"
                          ? "/admin"
                          : "/doctor",
                    })
                  }
                  size="sm"
                >
                  Go to Dashboard
                  <ArrowRightIcon />
                </Button>
              ) : (
                <>
                  <Button
                    onPress={() => navigate({ to: "/sign-up" })}
                    size="sm"
                  >
                    Get Started
                  </Button>
                  <Button
                    onPress={() => navigate({ to: "/sign-in" })}
                    size="sm"
                    variant="tertiary"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
