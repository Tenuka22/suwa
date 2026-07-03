import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardHeader } from "@suwa/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@suwa/ui/components/empty";
import { Separator } from "@suwa/ui/components/separator";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, FileTextIcon } from "lucide-react";
import { z } from "zod";

import { buildHeadFromKey } from "../../__root";
import { orpc } from "@/utils/orpc";

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/admin/plans/")({
  head: () => buildHeadFromKey("web:admin:plans:index"),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    const input = { page: deps.page };
    return context.queryClient.ensureQueryData(
      orpc.plans.queryOptions({ input })
    );
  },
  component: AdminPlansRoute,
});

function AdminPlansRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const data = Route.useLoaderData();

  const rows = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">Plans</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-lg tracking-tight">
                Consultation plans
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm">
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
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-sm">All plans</h2>
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
                  className="rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"
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
                        ${((plan.priceCents ?? 1500) / 100).toFixed(2)}
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
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!data?.prevPage}
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
                  disabled={!data?.nextPage}
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
