import { Chip } from "@heroui/react";
import { CheckCircle2Icon, Clock3Icon, XCircleIcon } from "lucide-react";

export function SessionStatusBadge({ status }: { status: string }) {
  if (status === "requested" || status === "rescheduled") {
    return (
      <Chip className="gap-1" color="default" variant="soft">
        <Clock3Icon className="size-3.5" />
        {status === "requested" ? "Requested" : "Rescheduled"}
      </Chip>
    );
  }

  if (status === "approved" || status === "attended") {
    return (
      <Chip className="gap-1" color="accent" variant="soft">
        <CheckCircle2Icon className="size-3.5" />
        {status === "approved" ? "Approved" : "Attended"}
      </Chip>
    );
  }

  return (
    <Chip className="gap-1" color="danger" variant="soft">
      <XCircleIcon className="size-3.5" />
      Failed
    </Chip>
  );
}
