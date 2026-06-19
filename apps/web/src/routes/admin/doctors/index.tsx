import { Button, Chip, Input, Separator } from "@heroui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronLeft,
  ChevronRight,
  SearchIcon,
  StethoscopeIcon,
} from "lucide-react";
import { z } from "zod";

import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CheckCircle2Icon;
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
            <StethoscopeIcon className="size-6 text-accent" />
          </Chip>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">Doctors</h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <CheckCircle2Icon className="size-3" />
                </div>
                Approved
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              View and manage all approved doctor accounts on the platform.
              Review their profiles, credentials, and activity.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={CheckCircle2Icon}
            label="approved doctors"
            value={totalCount.toString()}
          />
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div className="flex flex-col gap-3">
          <div>
            <PageTitle>Approved doctors</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Browse approved doctors and view their details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/60" />
              <Input
                className="h-10 rounded-full border-none bg-foreground/5 pl-10 focus-visible:ring-1 focus-visible:ring-primary/50"
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
              variant="secondary"
            >
              Reset
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <StethoscopeIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No doctors found</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              {search.query
                ? "No doctors match your search query."
                : "No doctors have been approved yet."}
            </p>
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
                <div
                  className="flex flex-col gap-4 rounded-xl border border-border px-4 py-3 md:flex-row md:items-center md:justify-between"
                  key={doctor.userId}
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-full border border-border border-dashed bg-foreground/5 p-3">
                      <StethoscopeIcon className="size-4 text-foreground/50" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="font-light text-sm">{doctor.name}</p>
                      <div className="flex flex-wrap gap-3">
                        {doctor.email ? (
                          <p className="text-foreground/60 text-xs">
                            {doctor.email}
                          </p>
                        ) : null}
                        {doctor.phone ? (
                          <p className="text-foreground/60 text-xs">
                            {doctor.phone}
                          </p>
                        ) : null}
                      </div>
                      <Chip
                        className="mt-1 gap-1"
                        color="success"
                        variant="soft"
                      >
                        <div className="flex items-center justify-center">
                          <CheckCircle2Icon className="size-3" />
                        </div>
                        Approved
                      </Chip>
                    </div>
                  </div>

                  <Link
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-foreground/5 px-3 py-1.5 font-medium text-sm transition-colors hover:bg-foreground/10"
                    params={{ doctorId: doctor.userId }}
                    to="/admin/doctors/$doctorId"
                  >
                    View details
                    <ArrowRightIcon className="size-3" />
                  </Link>
                </div>
              )
            )}
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
      </section>
    </div>
  );
}
