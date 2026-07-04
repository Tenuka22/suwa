import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/doctor/requests")({
  component: AdminDoctorRequestsLayout,
});

function AdminDoctorRequestsLayout() {
  return <Outlet />;
}
