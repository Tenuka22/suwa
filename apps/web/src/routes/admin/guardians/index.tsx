import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent, CardHeader } from "@zen-doc/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@zen-doc/ui/components/empty";
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";
import { z } from "zod";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

interface GuardianItem {
  createdAt: string;
  email: string;
  phone: string | null;
  userId: string;
}

interface GuardiansPage {
  items: GuardianItem[];
  nextPage: number | null;
  page: number;
  prevPage: number | null;
}

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/admin/guardians/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({
    context,
    deps,
  }): Promise<{ initialData: GuardiansPage }> => {
    const input = { page: deps.page };
    try {
      const initialData = await context.queryClient.fetchQuery<GuardiansPage>({
        queryKey: orpc.guardians.queryKey({ input }),
        queryFn: () => orpc.guardians.call(input),
      });
      return { initialData };
    } catch {
      return {
        initialData: { items: [], page: 1, prevPage: null, nextPage: null },
      };
    }
  },
  component: AdminGuardiansRoute,
});

function AdminGuardiansRoute() {
  const user = useUser();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const input = { page: search.page };

  const guardiansQuery = useQuery({
    queryKey: orpc.guardians.queryKey({ input }),
    queryFn: () => orpc.guardians.call(input),
    initialData: loaderData.initialData,
    enabled:
      user.isLoaded &&
      !!user.user &&
      getMetadataRole(user.user.publicMetadata) === "admin",
  });

  const rows = guardiansQuery.data?.items ?? [];

  if (!user.isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!user.user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Sign in required
              </h2>
              <p className="text-muted-foreground text-sm">
                Access the admin panel after signing in.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getMetadataRole(user.user?.publicMetadata) !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Unauthorized
              </h2>
              <p className="text-muted-foreground text-sm">
                You do not have admin access.
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">Guardians</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Guardians
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                View all guardian accounts registered on the platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-xl tracking-tight">
                Registered guardians
              </h2>
              <p className="text-muted-foreground text-sm">
                All guardians ordered by registration date.
              </p>
            </div>
            <Badge className="gap-1" variant="secondary">
              <UserRoundIcon className="size-3" />
              {rows.length} guardian{rows.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserRoundIcon />
                </EmptyMedia>
                <EmptyTitle>No guardians yet</EmptyTitle>
                <EmptyDescription>
                  Guardians will appear once they register on the platform.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((guardian) => (
                <Card
                  className="rounded-2xl border-border/60 transition-colors hover:bg-muted/30"
                  key={guardian.userId}
                >
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                        <UserRoundIcon className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{guardian.email}</p>
                        {guardian.phone ? (
                          <p className="text-muted-foreground text-xs">
                            {guardian.phone}
                          </p>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground">
                          Registered{" "}
                          {format(new Date(guardian.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {guardiansQuery.data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!guardiansQuery.data?.prevPage}
                  onClick={() => {
                    navigate({
                      search: { page: Math.max(1, search.page - 1) },
                      replace: true,
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft className="mr-1 size-3" />
                  Prev
                </Button>
                <Button
                  disabled={!guardiansQuery.data?.nextPage}
                  onClick={() => {
                    navigate({
                      search: { page: search.page + 1 },
                      replace: true,
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  Next
                  <ChevronRight className="ml-1 size-3" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
