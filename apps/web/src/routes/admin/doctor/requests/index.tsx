import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type Updater,
} from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { client } from "@/utils/orpc";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Input } from "@suwa/ui/components/input";
import { Progress } from "@suwa/ui/components/progress";

const doctorRequestsSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  perPage: z.coerce.number().int().positive().max(100).catch(10),
  query: z.string().catch(""),
  sortBy: z.enum(["name", "email", "completeness"]).catch("name"),
  sortDirection: z.enum(["asc", "desc"]).catch("asc"),
});

type DoctorRequestsSearch = z.infer<typeof doctorRequestsSearchSchema>;

type DoctorRequestRow = {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  permanent: boolean;
  specialties?: string | null;
  completeness: number;
};

export const Route = createFileRoute("/admin/doctor/requests/")({
  validateSearch: doctorRequestsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => client.pendingDoctors(deps),
  component: AdminDoctorRequestsRoute,
});

function getNextValue<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(current)
    : updater;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseList(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // Fall back to comma-separated strings from older rows.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AdminDoctorRequestsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const data = Route.useLoaderData();

  const rows = (data.items ?? []) as DoctorRequestRow[];
  const pageCount = Math.max(1, Math.ceil((data.totalCount ?? 0) / search.perPage));
  const sorting: SortingState = [
    { id: search.sortBy, desc: search.sortDirection === "desc" },
  ];
  const pagination: PaginationState = {
    pageIndex: search.page - 1,
    pageSize: search.perPage,
  };

  const updateSearch = (next: Partial<DoctorRequestsSearch>) => {
    void navigate({
      replace: true,
      search: {
        ...search,
        ...next,
      },
    });
  };

  const columns = useMemo<ColumnDef<DoctorRequestRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Doctor" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-56 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted font-medium text-xs">
              {getInitials(row.original.name) || "DR"}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium">{row.original.name}</div>
              <div className="truncate text-muted-foreground text-xs">
                ID {row.original.userId}
              </div>
            </div>
          </div>
        ),
        meta: { label: "Doctor" },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Contact" />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-48 flex-col gap-1">
            <span className="truncate">{row.original.email ?? "No email"}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.phone ?? "No phone"}
            </span>
          </div>
        ),
        meta: { label: "Contact" },
      },
      {
        accessorKey: "specialties",
        enableSorting: false,
        header: "Specialties",
        cell: ({ row }) => {
          const specialties = parseList(row.original.specialties);
          if (specialties.length === 0) {
            return <span className="text-muted-foreground">Not provided</span>;
          }
          return (
            <div className="flex max-w-64 flex-wrap gap-1">
              {specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="outline">
                  {formatLabel(specialty)}
                </Badge>
              ))}
              {specialties.length > 3 ? (
                <Badge variant="secondary">+{specialties.length - 3}</Badge>
              ) : null}
            </div>
          );
        },
        meta: { label: "Specialties" },
      },
      {
        accessorKey: "completeness",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Completeness" />
        ),
        cell: ({ row }) => (
          <div className="grid min-w-36 gap-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{row.original.completeness}%</span>
              <span className="text-muted-foreground text-xs">complete</span>
            </div>
            <Progress value={row.original.completeness} />
          </div>
        ),
        meta: { label: "Completeness" },
      },
      {
        id: "status",
        enableSorting: false,
        header: "Status",
        cell: () => <Badge variant="secondary">Pending review</Badge>,
        meta: { label: "Status" },
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => (
          <Button
            render={
              <Link
                params={{ doctorId: row.original.userId }}
                to="/admin/doctor/requests/$doctorId"
              />
            }
            size="sm"
          >
            Review request
          </Button>
        ),
        meta: { label: "Actions" },
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.userId,
    manualPagination: true,
    manualSorting: true,
    onPaginationChange: (updater) => {
      const next = getNextValue(updater, pagination);
      updateSearch({
        page: next.pageIndex + 1,
        perPage: next.pageSize,
      });
    },
    onSortingChange: (updater) => {
      const next = getNextValue(updater, sorting);
      const firstSort = next[0];
      const sortBy = firstSort?.id;
      updateSearch({
        page: 1,
        sortBy:
          sortBy === "email" || sortBy === "completeness" || sortBy === "name"
            ? sortBy
            : "name",
        sortDirection: firstSort?.desc ? "desc" : "asc",
      });
    },
    pageCount,
    state: {
      pagination,
      sorting,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor requests</CardTitle>
          <CardDescription>
            Review pending doctor verification requests and approve eligible accounts.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{data.totalCount ?? 0} pending</Badge>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending submissions</CardTitle>
          <CardDescription>
            Sort, search, and open each request for a full review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable table={table}>
            <DataTableToolbar table={table}>
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => {
                    updateSearch({ page: 1, query: event.target.value });
                  }}
                  placeholder="Search name or email"
                  value={search.query}
                />
              </div>
            </DataTableToolbar>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}
