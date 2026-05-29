import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { Separator } from "@zen-doc/ui/components/separator";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { format } from "date-fns";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ChevronLeft,
  ChevronRight,
  DollarSignIcon,
  ShieldIcon,
} from "lucide-react";
import { z } from "zod";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

interface TransactionItem {
  amount: number;
  createdAt: string;
  id: string;
  sessionId: string | null;
  type: string;
  userId: string;
}

interface CreditTransactionsPage {
  items: TransactionItem[];
  nextPage: number | null;
  page: number;
  prevPage: number | null;
}

const searchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/admin/credits/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({
    context,
    deps,
  }): Promise<{ initialData: CreditTransactionsPage }> => {
    const input = { page: deps.page };
    try {
      const initialData =
        await context.queryClient.fetchQuery<CreditTransactionsPage>({
          queryKey: orpc.creditTransactions.queryKey({ input }),
          queryFn: () => orpc.creditTransactions.call(input),
        });
      return { initialData };
    } catch {
      return {
        initialData: { items: [], page: 1, prevPage: null, nextPage: null },
      };
    }
  },
  component: AdminCreditsRoute,
});

function AdminCreditsRoute() {
  const user = useUser();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const input = { page: search.page };

  const transactionsQuery = useQuery({
    queryKey: orpc.creditTransactions.queryKey({ input }),
    queryFn: () => orpc.creditTransactions.call(input),
    initialData: loaderData.initialData,
    enabled:
      user.isLoaded &&
      !!user.user &&
      getMetadataRole(user.user.publicMetadata) === "admin",
  });

  const rows = transactionsQuery.data?.items ?? [];

  if (!user.isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!user.user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Sign in required
              </h2>
              <p className="text-muted-foreground text-sm">
                Access the admin panel after signing in.
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (getMetadataRole(user.user?.publicMetadata) !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-xl tracking-tight">
                Unauthorized
              </h2>
              <p className="text-muted-foreground text-sm">
                You do not have admin access.
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">Credits</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-4xl tracking-tight">
                Credit transactions
              </h1>
              <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                Monitor all credit purchases, deductions, and refunds across the
                platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-semibold text-xl tracking-tight">
                Transaction history
              </h2>
              <p className="text-muted-foreground text-sm">
                All credit transactions ordered by most recent.
              </p>
            </div>
            <Badge className="gap-1" variant="secondary">
              <DollarSignIcon className="size-3" />
              {rows.length} transaction{rows.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DollarSignIcon />
                </EmptyMedia>
                <EmptyTitle>No transactions yet</EmptyTitle>
                <EmptyDescription>
                  Credit transactions will appear once users start purchasing
                  credits.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((tx) => (
                <Card
                  className="rounded-2xl border-border/60 transition-colors hover:bg-muted/30"
                  key={tx.id}
                >
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-2xl border bg-muted/40 p-2.5 ${
                          tx.type === "purchase"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {tx.type === "purchase" ? (
                          <ArrowUpCircleIcon className="size-4" />
                        ) : (
                          <ArrowDownCircleIcon className="size-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="font-medium text-sm capitalize">
                          {tx.type}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {format(
                            new Date(tx.createdAt),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          User: {tx.userId.slice(0, 12)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p
                        className={`font-semibold text-sm ${
                          tx.type === "purchase"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {tx.type === "purchase" ? "+" : "-"}
                        {tx.amount}
                      </p>
                      {tx.sessionId ? (
                        <p className="text-[10px] text-muted-foreground">
                          Session: {tx.sessionId.slice(0, 8)}...
                        </p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {transactionsQuery.data?.page ?? search.page}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={!transactionsQuery.data?.prevPage}
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
                  disabled={!transactionsQuery.data?.nextPage}
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
