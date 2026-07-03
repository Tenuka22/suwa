import { createFileRoute } from "@tanstack/react-router";

import { DoctorSessionRoom } from "../../sessions/$sessionId";
import { buildHeadFromKey } from "../../../__root";

export const Route = createFileRoute("/doctor/test/session/$sessionId")({
  head: () => buildHeadFromKey("web:doctor:sessions:detail"),
  component: DoctorTestSessionDetailRoute,
});

function DoctorTestSessionDetailRoute() {
  const { sessionId } = Route.useParams();
  return <DoctorSessionRoom backTo="/doctor/test/session" sessionId={sessionId} />;
}
