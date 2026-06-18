import { Button, Card, Chip, Input, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Clock3Icon,
  InboxIcon,
  Search,
  UserCheckIcon,
} from "lucide-react";
import { z } from "zod";

import { useApproveDoctor } from "@/hooks/queries/admin";
import { orpc } from "@/utils/orpc";

const adminSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  query: z.string().catch(""),
});

export const Route = createFileRoute("/admin/doc-requests/")({
  validateSearch: adminSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    query: search.query,
  }),
  loader: async ({ context, deps }) => {
    const input = { page: deps.page, query: deps.query };
    return context.queryClient.ensureQueryData(
      orpc.pendingDoctors.queryOptions({ input })
    );
  },
  component: AdminDocRequestsRoute,
});

function AdminDocRequestsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const approveDoctor = useApproveDoctor();

  const rows = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <Card.Content>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Chip variant="secondary">Admin console</Chip>
              <Chip color="default" variant="soft">
                Doctor requests
              </Chip>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-semibold text-lg tracking-tight">
                Doctor requests
              </h1>

              <p className="max-w-2xl text-muted-foreground text-sm">
                Review onboarding submissions, verify credentials, and approve
                new doctor accounts to join the platform.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <Card.Header>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="font-medium text-sm">Pending submissions</h2>
              <p className="text-muted-foreground text-sm">
                Doctors awaiting your review and approval.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 md:w-64"
                  onChange={(event) => {
                    navigate({
                      search: {
                        page: 1,
                        query: event.target.value,
                      },
                      replace: true,
                    });
                  }}
                  placeholder="Search doctor requests..."
                  value={search.query}
                />
              </div>
              <Button
                onPress={() => {
                  navigate({
                    search: {
                      page: 1,
                      query: "",
                    },
                    replace: true,
                  });
                }}
                size="sm"
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </div>
        </Card.Header>

        <Separator />

        <Card.Content>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="rounded-2xl border bg-muted/40 p-4 text-muted-foreground">
                <InboxIcon className="size-6" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="font-medium text-sm">No pending requests</p>
                <p className="max-w-sm text-muted-foreground text-xs">
                  All doctor requests have been reviewed. Check back later for
                  new submissions.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map(
                (doctor: {
                  userId: string;
                  name: string;
                  email: string | null;
                  phone: string | null;
                  role: string;
                  permanent: boolean;
                }) => (
                  <Card
                    className="rounded-2xl border-border/60 transition-colors duration-200 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary"
                    key={doctor.userId}
                  >
                    <Card.Content className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                          <UserCheckIcon className="size-4" />
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-sm">{doctor.name}</p>
                          <div className="flex flex-wrap gap-3">
                            {doctor.email ? (
                              <p className="text-muted-foreground text-xs">
                                {doctor.email}
                              </p>
                            ) : null}
                            {doctor.phone ? (
                              <p className="text-muted-foreground text-xs">
                                {doctor.phone}
                              </p>
                            ) : null}
                          </div>
                          <Chip
                            className="mt-1"
                            color={doctor.permanent ? "default" : "danger"}
                            variant="soft"
                          >
                            <Clock3Icon className="size-3" />
                            {doctor.permanent ? "Approved" : "Pending"}
                          </Chip>
                        </div>
                      </div>

                      <Button
                        isDisabled={approveDoctor.isPending}
                        onPress={() => {
                          approveDoctor.mutate({ userId: doctor.userId });
                        }}
                        size="sm"
                      >
                        {approveDoctor.isPending ? "Approving..." : "Approve"}
                      </Button>
                    </Card.Content>
                  </Card>
                )
              )}
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
                      search: {
                        page: Math.max(1, search.page - 1),
                        query: search.query,
                      },
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
                      search: {
                        page: search.page + 1,
                        query: search.query,
                      },
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
