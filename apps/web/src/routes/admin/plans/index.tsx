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
import {
  ChevronLeft,
  ChevronRight,
  FileTextIcon,
  ShieldIcon,
} from "lucide-react";
import { z } from "zod";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

interface PlanItem {
  createdAt: string;
  creditCost: number;
  description: string | null;
  doctorId: string;
  durationMinutes: number;
  features: string | null;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  sortOrder: number;
}

interface PlansPage {
  items: PlanItem[];
  nextPage: number | null;
  page: number;
  prevPage: number | null;
}

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/admin/plans/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }): Promise<{ initialData: PlansPage }> => {
    const input = { page: deps.page };
    try {
      const initialData = await context.queryClient.fetchQuery<PlansPage>({
        queryKey: orpc.plans.queryKey({ input }),
        queryFn: () => orpc.plans.call(input),
      });
      return { initialData };
    } catch {
      return {
        initialData: { items: [], page: 1, prevPage: null, nextPage: null },
      };
    }
  },
  component: AdminPlansRoute,
});

function AdminPlansRoute() {
  const user = useUser();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const input = { page: search.page };

  const plansQuery = useQuery({
    queryKey: orpc.plans.queryKey({ input }),
    queryFn: () => orpc.plans.call(input),
    initialData: loaderData.initialData,
    enabled:
      user.isLoaded &&
      !!user.user &&
      getMetadataRole(user.user.publicMetadata) === "admin",
  });

  const rows = plansQuery.data?.items ?? [];

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
              <Badge variant="secondary">Plans</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Consultation plans
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                View all consultation plans across the platform, including
                pricing, duration, and features.
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
                All plans
              </h2>
              <p className="text-muted-foreground text-sm">
                Plans ordered by most recently created.
              </p>
            </div>
            <Badge className="gap-1" variant="secondary">
              <FileTextIcon className="size-3" />
              {rows.length} plan{rows.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>No plans yet</EmptyTitle>
                <EmptyDescription>
                  Plans will appear once doctors create them.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((plan) => (
                <Card
                  className="rounded-2xl border-border/60 transition-colors hover:bg-muted/30"
                  key={plan.id}
                >
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{plan.name}</p>
                        <p className="text-muted-foreground text-xs">
                          Doctor: {plan.doctorId.slice(0, 12)}...
                        </p>
                      </div>
                      {plan.isActive ? (
                        <Badge className="shrink-0" variant="default">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="shrink-0" variant="secondary">
                          Inactive
                        </Badge>
                      )}
                    </div>

                    {plan.description ? (
                      <p className="text-muted-foreground text-xs">
                        {plan.description}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {plan.creditCost} credit
                        {plan.creditCost === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.durationMinutes} min
                      </span>
                      {plan.isDefault ? (
                        <span className="font-medium text-primary">
                          Default
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {plansQuery.data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!plansQuery.data?.prevPage}
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
                  disabled={!plansQuery.data?.nextPage}
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
