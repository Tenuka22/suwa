import { createFileRoute } from "@tanstack/react-router";

import { DoctorTestSessionsContent } from "../sessions";
import { buildHeadFromKey } from "../../../__root";

export const Route = createFileRoute("/doctor/test/session/")({
  head: () => buildHeadFromKey("web:doctor:sessions:detail"),
  component: DoctorTestSessionIndexRoute,
});

function DoctorTestSessionIndexRoute() {
  return <DoctorTestSessionsContent />;
}
