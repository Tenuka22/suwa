import { UserButton, useUser } from "@clerk/tanstack-react-start";
import { Button, Card, Chip, Separator } from "@heroui/react";
import { APP_DISPLAY_NAME } from "@suwa/app-info";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, Building2Icon, StethoscopeIcon } from "lucide-react";

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
        <section className="bg-gradient-to-b from-accent/5 via-accent/[2%] to-background px-6 pb-20 pt-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Chip color="accent" variant="soft">
                Doctor and Tenant Workspace
              </Chip>
              <h1 className="max-w-3xl pt-2 font-light text-4xl tracking-tight sm:text-5xl lg:text-6xl">
                Welcome to {APP_DISPLAY_NAME}
              </h1>
              <p className="max-w-2xl font-light text-lg text-muted-foreground sm:text-xl">
                A simple home for doctors and tenants to manage profiles,
                access dashboards, and get started fast.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <Card.Content className="flex flex-col gap-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <StethoscopeIcon className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-medium text-2xl">For doctors</h2>
                    <p className="text-muted-foreground text-sm">
                      Manage your profile, verify your identity, and continue to
                      your doctor dashboard.
                    </p>
                  </div>
                  <Button
                    onPress={() => navigate({ to: "/doctor", search: { page: 1 } })}
                    size="sm"
                    variant="outline"
                  >
                    Open doctor area
                    <ArrowRightIcon />
                  </Button>
                </Card.Content>
              </Card>

              <Card className="border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
                <Card.Content className="flex flex-col gap-4 p-6">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Building2Icon className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-medium text-2xl">For tenants</h2>
                    <p className="text-muted-foreground text-sm">
                      View your workspace and continue to tenant tools and
                      administrative pages.
                    </p>
                  </div>
                  <Button onPress={() => navigate({ to: "/tenant" })} size="sm" variant="outline">
                    Open tenant area
                    <ArrowRightIcon />
                  </Button>
                </Card.Content>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/60 bg-background/70">
                <Card.Content className="flex flex-col gap-2 p-5">
                  <Chip color="accent" size="sm" variant="soft">
                    Fast setup
                  </Chip>
                  <p className="font-medium">Get in, update your profile, and move on.</p>
                  <p className="text-muted-foreground text-sm">
                    Doctors can review their profile details and verify identity.
                    Tenants can jump straight into the workspace tools.
                  </p>
                </Card.Content>
              </Card>

              <Card className="border-border/60 bg-background/70">
                <Card.Content className="flex flex-col gap-2 p-5">
                  <Chip color="accent" size="sm" variant="soft">
                    Clear roles
                  </Chip>
                  <p className="font-medium">The right tools for each account type.</p>
                  <p className="text-muted-foreground text-sm">
                    Doctors get a profile-focused dashboard. Tenants get access
                    to tenant operations and administrative screens.
                  </p>
                </Card.Content>
              </Card>

              <Card className="border-border/60 bg-background/70">
                <Card.Content className="flex flex-col gap-2 p-5">
                  <Chip color="accent" size="sm" variant="soft">
                    Support ready
                  </Chip>
                  <p className="font-medium">A simple starting point for teams.</p>
                  <p className="text-muted-foreground text-sm">
                    Use this page to orient new users before they enter the main
                    app areas.
                  </p>
                </Card.Content>
              </Card>
            </div>

            <Separator />

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/60 bg-background/80">
                <Card.Content className="flex flex-col gap-4 p-6">
                  <div className="space-y-2">
                    <Chip color="accent" variant="soft">
                      What you can do here
                    </Chip>
                    <h2 className="font-medium text-2xl">A quick landing zone</h2>
                    <p className="text-muted-foreground text-sm">
                      This page is a lightweight entry point for doctors and
                      tenants. It points each person to the right place without
                      making them hunt through the app.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="font-medium">Doctors</p>
                      <p className="text-muted-foreground text-sm">
                        Manage profile data, face verification, and doctor
                        dashboard access.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="font-medium">Tenants</p>
                      <p className="text-muted-foreground text-sm">
                        Continue into tenant operations, admin flows, and shared
                        workspace tools.
                      </p>
                    </div>
                  </div>
                </Card.Content>
              </Card>

              <Card className="border-border/60 bg-background/80">
                <Card.Content className="flex flex-col gap-4 p-6">
                  <div className="space-y-2">
                    <Chip color="accent" variant="soft">
                      Quick path
                    </Chip>
                    <h2 className="font-medium text-2xl">Where to go next</h2>
                  </div>

                  <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                    <p>• New doctor? Open the doctor area and finish your profile.</p>
                    <p>• Existing tenant? Head straight to tenant tools.</p>
                    <p>• Admin user? Use the dashboard button after signing in.</p>
                  </div>

                  <Button
                    onPress={() => navigate({ to: "/sign-up" })}
                    size="sm"
                    variant="outline"
                  >
                    Create an account
                    <ArrowRightIcon />
                  </Button>
                </Card.Content>
              </Card>
            </div>

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
                  <Button onPress={() => navigate({ to: "/sign-up" })} size="sm">
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
