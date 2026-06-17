import { Badge } from "@suwa/ui/components/badge";
import { CheckCircle2Icon, Clock3Icon, XCircleIcon } from "lucide-react";

export function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested" || status === "rescheduled") {
    return (
      <Badge className="gap-1" variant="secondary">
        <Clock3Icon className="size-3.5" />
        {status === "requested" ? "Requested" : "Rescheduled"}
      </Badge>
    );
  }

  if (status === "approved" || status === "attended") {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2Icon className="size-3.5" />
        {status === "approved" ? "Approved" : "Attended"}
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="destructive">
      <XCircleIcon className="size-3.5" />
      Failed
    </Badge>
  );
}
