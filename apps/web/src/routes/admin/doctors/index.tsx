import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Input } from "@zen-doc/ui/components/input";
import { Separator } from "@zen-doc/ui/components/separator";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronLeft,
  ChevronRight,
  Search,
  StethoscopeIcon,
} from "lucide-react";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const adminSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  query: z.string().catch(""),
});

export const Route = createFileRoute("/admin/doctors/")({
  validateSearch: adminSearchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page,
    query: search.query,
  }),
  loader: async ({ context, deps }) => {
    const input = { page: deps.page, query: deps.query };
    return context.queryClient.ensureQueryData(
      orpc.approvedDoctors.queryOptions({ input })
    );
  },
  component: AdminDoctorsRoute,
});

function AdminDoctorsRoute() {
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
              <Badge variant="secondary">Doctors</Badge>
            </div>

            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">Doctors</h1>

              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                View and manage all approved doctor accounts on the platform.
                Review their profiles, credentials, and activity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold text-xl tracking-tight">
                Approved doctors
              </h2>
              <p className="text-muted-foreground text-sm">
                Browse approved doctors and view their details.
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
                  placeholder="Search approved doctors..."
                  value={search.query}
                />
              </div>
              <Button
                onClick={() => {
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
        </CardHeader>

        <Separator />

        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <StethoscopeIcon />
                </EmptyMedia>
                <EmptyTitle>No doctors found</EmptyTitle>
                <EmptyDescription>
                  {search.query
                    ? "No doctors match your search query."
                    : "No doctors have been approved yet."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
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
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                          <StethoscopeIcon className="size-4" />
                        </div>

                        <div className="space-y-1">
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
                          <Badge className="mt-1 gap-1" variant="default">
                            <CheckCircle2Icon className="size-3" />
                            Approved
                          </Badge>
                        </div>
                      </div>

                      <Link
                        className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 font-medium text-sm transition-colors hover:bg-muted/30"
                        params={{ doctorId: doctor.userId }}
                        to="/admin/doctors/$doctorId"
                      >
                        View details
                        <ArrowRightIcon className="size-3" />
                      </Link>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!data?.prevPage}
                  onClick={() => {
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
                  disabled={!data?.nextPage}
                  onClick={() => {
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
        </CardContent>
      </Card>
    </div>
  );
}
