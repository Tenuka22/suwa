import { Button, Chip, Input, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Clock3Icon,
  InboxIcon,
  SearchIcon,
  StethoscopeIcon,
  UserCheckIcon,
  EyeIcon,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { ApprovalModal } from "@/components/admin/approval-modal";
import { BodyText, PageTitle } from "@/components/typography";
import { useApproveDoctor } from "@/hooks/queries/admin";
import { orpc } from "@/utils/orpc";

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof InboxIcon;
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

interface PendingDoctor {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  bio: string | null;
  displayName: string | null;
  completeness: number;
  permanent: boolean;
}

function AdminDocRequestsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const approveDoctor = useApproveDoctor();
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(
    null
  );

  const rows = (data?.items ?? []) as PendingDoctor[];
  const pendingCount = data?.totalCount ?? rows.length;

  const handleApprove = (userId: string) => {
    approveDoctor.mutate(
      { userId },
      {
        onSuccess: () => {
          setSelectedDoctor(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <Chip
            className="flex size-16 items-center justify-center rounded-full bg-accent/10"
            variant="tertiary"
          >
            <StethoscopeIcon className="size-6 text-accent" />
          </Chip>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                Doctor requests
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <StethoscopeIcon className="size-3" />
                </div>
                Pending review
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Review onboarding submissions, verify credentials, and approve new
              doctor accounts to join the platform.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-2 px-6">
        <PageTitle>Overview</PageTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <StatItem
            icon={InboxIcon}
            label="pending"
            value={pendingCount.toString()}
          />
          {pendingCount > 0 && (
            <Chip color="warning" variant="soft">
              <div className="flex items-center justify-center">
                <Clock3Icon className="size-3" />
              </div>
              Needs your review
            </Chip>
          )}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div className="flex flex-col gap-3">
          <div>
            <PageTitle>Pending submissions</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Doctors awaiting your review and approval.
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
              variant="secondary"
            >
              Reset
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <InboxIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No pending requests</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              {search.query
                ? "No doctors match your search query."
                : "All doctor requests have been reviewed. Check back later for new submissions."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((doctor: PendingDoctor) => (
              <div
                className="flex flex-col gap-4 rounded-xl border border-border px-4 py-3 md:flex-row md:items-center md:justify-between"
                key={doctor.userId}
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full border border-border border-dashed bg-foreground/5 p-3">
                    <UserCheckIcon className="size-4 text-foreground/50" />
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
                      className="mt-1"
                      color={doctor.permanent ? "success" : "warning"}
                      variant="soft"
                    >
                      <div className="flex items-center justify-center">
                        <Clock3Icon className="size-3" />
                      </div>
                      {doctor.permanent ? "Approved" : "Pending"}
                    </Chip>
                  </div>
                </div>

                <Button
                  onPress={() => setSelectedDoctor(doctor)}
                  size="sm"
                  variant="primary"
                >
                  <EyeIcon className="size-4" />
                  View Request
                </Button>
              </div>
            ))}
          </div>
        )}

        {rows.length > 0 ? (
          <div className="flex items-center justify-between pt-4">
            <p className="text-foreground/60 text-sm">
              Page {data?.page ?? search.page} &middot;{" "}
              {data?.totalCount ?? 0} total
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

      {selectedDoctor && (
        <ApprovalModal
          doctor={selectedDoctor}
          isApproving={approveDoctor.isPending}
          onApprove={handleApprove}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDoctor(null);
            }
          }}
          open={!!selectedDoctor}
        />
      )}
    </div>
  );
}
