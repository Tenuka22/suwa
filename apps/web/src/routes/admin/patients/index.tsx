import { Button, Card, Chip, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, UserRoundIcon } from "lucide-react";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

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

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <Card.Content>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Chip variant="secondary">Admin console</Chip>
              <Chip color="default" variant="soft">
                Patients
              </Chip>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-lg tracking-tight">Patients</h1>

              <p className="max-w-2xl text-muted-foreground text-sm">
                View all registered patients on the platform and their
                onboarding status.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <Card.Header>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-sm">Registered patients</h2>
              <p className="text-muted-foreground text-sm">
                All patients ordered by registration date.
              </p>
            </div>

            <Chip className="gap-1" color="default" variant="soft">
              <UserRoundIcon className="size-3" />
              {rows.length} patient{rows.length === 1 ? "" : "s"}
            </Chip>
          </div>
        </Card.Header>

        <Separator />

        <Card.Content>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
                <UserRoundIcon className="size-6" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="font-medium text-sm">No patients yet</p>
                <p className="max-w-sm text-muted-foreground text-xs">
                  Patients will appear once they register on the platform.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((patient) => (
                <Card
                  className="cursor-pointer rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"
                  key={patient.userId}
                >
                  <Card.Content className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                        <UserRoundIcon className="size-4" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">{patient.alias}</p>
                      </div>
                    </div>

                    <Chip
                      color={
                        patient.isOnboardingComplete ? "accent" : "default"
                      }
                      variant="soft"
                    >
                      {patient.isOnboardingComplete ? "Onboarded" : "Pending"}
                    </Chip>
                  </Card.Content>
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
        </Card.Content>
      </Card>
    </div>
  );
}
