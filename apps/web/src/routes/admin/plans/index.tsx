import { Button, Chip, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ClockIcon,
  CoinsIcon,
  FileTextIcon,
} from "lucide-react";
import { z } from "zod";

import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileTextIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-foreground/50" />
      <span className="font-medium text-sm tabular-nums">{value}</span>
      <span className="text-foreground/60 text-sm">{label}</span>
    </div>
  );
}

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/admin/plans/")({
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
  const totalCount = rows.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <Chip
            className="flex size-16 items-center justify-center rounded-full bg-accent/10"
            variant="tertiary"
          >
            <FileTextIcon className="size-6 text-accent" />
          </Chip>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                Consultation plans
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <FileTextIcon className="size-3" />
                </div>
                Directory
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              View all consultation plans across the platform, including
              pricing, duration, and features.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={FileTextIcon}
            label="total plans"
            value={totalCount.toString()}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>All plans</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Plans ordered by most recently created.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <FileTextIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No plans yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Plans will appear once doctors create them.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((plan) => (
              <div
                className="rounded-xl border border-border px-4 py-3 transition-colors hover:bg-foreground/5"
                key={plan.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-light text-sm">{plan.name}</p>
                    <p className="text-foreground/60 text-xs">
                      Doctor: {plan.doctorId.slice(0, 12)}...
                    </p>
                  </div>
                  {plan.isActive ? (
                    <Chip className="shrink-0" color="success" variant="soft">
                      Active
                    </Chip>
                  ) : (
                    <Chip className="shrink-0" color="default" variant="soft">
                      Inactive
                    </Chip>
                  )}
                </div>

                {plan.description ? (
                  <p className="mt-1 text-foreground/60 text-xs">
                    {plan.description}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center gap-4 border-border/50 border-t pt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <CoinsIcon className="size-3.5 text-foreground/50" />
                    <span className="text-foreground/60">
                      ${((plan.priceCents ?? 1500) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 text-foreground/50" />
                    <span className="text-foreground/60">
                      {plan.durationMinutes} min
                    </span>
                  </div>
                  {plan.isDefault ? (
                    <Chip className="text-[10px]" color="accent" variant="soft">
                      Default
                    </Chip>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length > 0 ? (
          <div className="flex items-center justify-between pt-4">
            <p className="text-foreground/60 text-sm">
              Page {data?.page ?? search.page} &middot; {totalCount} total
            </p>
            <div className="flex gap-2">
              <Button
                isDisabled={!data?.prevPage}
                onPress={() => {
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
                isDisabled={!data?.nextPage}
                onPress={() => {
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
      </section>
    </div>
  );
}
