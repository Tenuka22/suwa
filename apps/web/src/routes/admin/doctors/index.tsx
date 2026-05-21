import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Input } from "@zen-doc/ui/components/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

interface ApprovedDoctor {
  bio: string | null;
  email: string | null;
  imageUrl: string | null;
  licenseNumber: string | null;
  matchesQuery: boolean;
  name: string;
  permanent: boolean;
  phone: string | null;
  role: string;
  userId: string;
}

interface ApprovedDoctorsPage {
  firstUserId: string | null;
  items: ApprovedDoctor[];
  lastUserId: string | null;
  nextPage: number | null;
  page: number;
  prevPage: number | null;
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
  loader: async ({
    context,
    deps,
  }): Promise<{ initialData: ApprovedDoctorsPage }> => {
    const input = {
      page: deps.page,
      query: deps.query,
    };
    try {
      const initialData =
        await context.queryClient.fetchQuery<ApprovedDoctorsPage>({
          queryKey: orpc.approvedDoctors.queryKey({ input }),
          queryFn: () => orpc.approvedDoctors.call(input),
        });
      return { initialData };
    } catch {
      return {
        initialData: {
          items: [],
          page: 1,
          nextPage: null,
          prevPage: null,
          firstUserId: null,
          lastUserId: null,
        },
      };
    }
  },
  component: AdminDoctorsRoute,
});

function AdminDoctorsRoute() {
  const user = useUser();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const input = {
    page: search.page,
    query: search.query,
  };

  const approvedDoctors = useQuery({
    queryKey: orpc.approvedDoctors.queryKey({ input }),
    queryFn: () => orpc.approvedDoctors.call(input),
    initialData: loaderData.initialData,
    enabled:
      user.isLoaded &&
      !!user.user &&
      getMetadataRole(user.user.publicMetadata) === "admin",
  });

  const role = getMetadataRole(user.user?.publicMetadata) ?? "user";
  const rows = approvedDoctors.data?.items ?? [];

  if (!user.isLoaded) {
    return <div className="p-6">Loading...</div>;
  }
  if (!user.user) {
    return (
      <div className="p-6">
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Doctors</CardTitle>
            <CardDescription>
              View and manage approved doctor accounts.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Link className={buttonVariants({ variant: "outline" })} to="/">
              Home
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Current role: {role}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
          <CardDescription>
            Browse approved doctors and view their details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {role === "admin" ? null : (
            <p className="text-muted-foreground text-sm">
              Admin access required.
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => {
                  navigate({
                    search: {
                      page: 1,
                      query: event.target.value,
                    },
                    replace: true,
                  });
                }}
                placeholder="Search by name or email"
                value={search.query}
              />
            </div>
            <button
              className={buttonVariants({ variant: "outline" })}
              onClick={() => {
                navigate({
                  search: {
                    page: 1,
                    query: "",
                  },
                  replace: true,
                });
              }}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] gap-3 border-b bg-muted/50 px-4 py-3 font-medium text-sm">
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Status</div>
              <div />
            </div>
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
                  className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                  key={doctor.userId}
                >
                  <div className="font-medium">{doctor.name}</div>
                  <div>{doctor.email ?? "-"}</div>
                  <div>{doctor.phone ?? "-"}</div>
                  <div className="text-green-600 uppercase tracking-wide">
                    approved
                  </div>
                  <div className="flex justify-end">
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      params={{ doctorId: doctor.userId }}
                      to="/admin/doctors/$doctorId"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {approvedDoctors.data?.page ?? search.page}
              {approvedDoctors.data?.firstUserId
                ? ` · first ${approvedDoctors.data.firstUserId}`
                : ""}
              {approvedDoctors.data?.lastUserId
                ? ` · last ${approvedDoctors.data.lastUserId}`
                : ""}
            </p>
            <div className="flex gap-2">
              <button
                className={buttonVariants({ variant: "outline", size: "sm" })}
                disabled={!approvedDoctors.data?.prevPage}
                onClick={() => {
                  navigate({
                    search: {
                      page: Math.max(1, search.page - 1),
                      query: search.query,
                    },
                    replace: true,
                  });
                }}
                type="button"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Prev
              </button>
              <button
                className={buttonVariants({ variant: "outline", size: "sm" })}
                disabled={!approvedDoctors.data?.nextPage}
                onClick={() => {
                  navigate({
                    search: {
                      page: search.page + 1,
                      query: search.query,
                    },
                    replace: true,
                  });
                }}
                type="button"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getMetadataRole(
  metadata: Record<string, unknown> | null | undefined
): string | undefined {
  const role = metadata?.role;
  return typeof role === "string" ? role : undefined;
}
