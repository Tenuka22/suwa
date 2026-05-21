import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
  const user = useUser();
  const role = user.user?.publicMetadata?.role;
  const name = user.user?.fullName ?? user.user?.username ?? "Admin";

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Signed in as {name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>Current role: {typeof role === "string" ? role : "user"}</p>
          <Link
            className={buttonVariants({ variant: "outline" })}
            search={{ page: 1, query: "" }}
            to="/admin/doc-requests"
          >
            Doctor requests
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            search={{ page: 1, query: "" }}
            to="/admin/doctors"
          >
            Doctors
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
