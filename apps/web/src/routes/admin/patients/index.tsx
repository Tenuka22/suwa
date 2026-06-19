import { Button, Chip, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, UserRoundIcon } from "lucide-react";
import { z } from "zod";

import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRoundIcon;
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

export const Route = createFileRoute("/admin/patients/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, deps }) => {
    const input = { page: deps.page };
    return context.queryClient.ensureQueryData(
      orpc.patients.queryOptions({ input })
    );
  },
  component: AdminPatientsRoute,
});

function AdminPatientsRoute() {
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
            className="size-16 rounded-full bg-accent/10 flex items-center justify-center"
            variant="tertiary"
          >
            <UserRoundIcon className="size-6 text-accent" />
          </Chip>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">Patients</h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <UserRoundIcon className="size-3" />
                </div>
                Directory
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              View all registered patients on the platform and their onboarding
              status.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={UserRoundIcon}
            label="total patients"
            value={totalCount.toString()}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Registered patients</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            All patients ordered by registration date.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <UserRoundIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No patients yet</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              Patients will appear once they register on the platform.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((patient) => (
              <div
                className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
                key={patient.userId}
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full border border-border border-dashed bg-foreground/5 p-3">
                    <UserRoundIcon className="size-4 text-foreground/50" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="font-light text-sm">{patient.alias}</p>
                  </div>
                </div>

                <Chip
                  color={patient.isOnboardingComplete ? "success" : "warning"}
                  variant="soft"
                >
                  {patient.isOnboardingComplete ? "Onboarded" : "Pending"}
                </Chip>
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
