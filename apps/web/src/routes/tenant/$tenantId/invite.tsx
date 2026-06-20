import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Skeleton,
  TextArea,
  toast,
} from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckIcon,
  SendIcon,
  StethoscopeIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

import { BodyText, PageTitle } from "@/components/typography";
import {
  useInviteDoctor,
  useListTenantInvitations,
} from "@/hooks/queries/tenant";

export const Route = createFileRoute("/tenant/$tenantId/invite")({
  component: TenantInvitePage,
});

function TenantInvitePage() {
  const { tenantId } = Route.useParams();
  const inviteDoctor = useInviteDoctor();
  const { data: invitationsData, isLoading } =
    useListTenantInvitations(tenantId);

  const [doctorId, setDoctorId] = useState("");
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");

  const handleInvite = async () => {
    if (!doctorId.trim()) {
      toast.danger("Please enter a doctor ID");
      return;
    }

    try {
      await inviteDoctor.mutateAsync({
        tenantId,
        doctorId: doctorId.trim(),
        message: message.trim() || undefined,
      });
      toast.success("Invitation sent!");
      setDoctorId("");
      setMessage("");
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    }
  };

  const invitations = invitationsData?.invitations ?? [];
  const filteredInvitations =
    filterStatus === "ALL"
      ? invitations
      : invitations.filter((i) => i.status === filterStatus);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-44 overflow-hidden rounded-[2rem] bg-gradient-to-b from-accent/10 via-accent/5 to-background md:h-52" />

      <div className="relative z-10 -mt-16 flex flex-col gap-4 px-6">
        <div className="flex items-center gap-5">
          <div className="flex size-16 items-center justify-center rounded-full bg-accent/10">
            <UserPlusIcon className="size-6 text-accent" />
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-light text-2xl tracking-tight">
                Invite Doctor
              </h1>
              <Chip color="accent" variant="soft">
                <div className="flex items-center justify-center">
                  <StethoscopeIcon className="size-3" />
                </div>
                New affiliation
              </Chip>
            </div>

            <BodyText className="max-w-2xl">
              Send invitations to doctors to join this hospital.
            </BodyText>
          </div>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div>
          <PageTitle>Send New Invitation</PageTitle>
          <p className="font-light text-foreground/60 text-sm">
            Enter the doctor's user ID to send them an invitation.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border px-4 py-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="doctorId">Doctor ID *</Label>
            <Input
              id="doctorId"
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="Enter doctor's user ID..."
              value={doctorId}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Message (optional)</Label>
            <TextArea
              id="message"
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              value={message}
            />
          </div>
          <Button isDisabled={inviteDoctor.isPending} onPress={handleInvite}>
            <SendIcon className="size-4" />
            {inviteDoctor.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3 px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageTitle>Invitation History</PageTitle>
            <p className="font-light text-foreground/60 text-sm">
              Track all invitations sent for this hospital.
            </p>
          </div>
          <Select
            className="w-[140px]"
            onSelectionChange={(id) => setFilterStatus(String(id) ?? "ALL")}
            selectedKey={filterStatus}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="ALL">All</ListBox.Item>
                <ListBox.Item id="PENDING">Pending</ListBox.Item>
                <ListBox.Item id="ACCEPTED">Accepted</ListBox.Item>
                <ListBox.Item id="DECLINED">Declined</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full border border-border border-dashed bg-foreground/5 p-4">
              <SendIcon className="size-6 text-foreground/40" />
            </div>
            <p className="font-light text-sm">No invitations found</p>
            <p className="max-w-xs font-light text-foreground/60 text-sm">
              No invitations match the current filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredInvitations.map((inv) => (
              <div
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                key={inv.id}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{inv.doctorName}</p>
                    <Chip
                      className="text-[10px]"
                      color={
                        inv.status === "ACCEPTED"
                          ? "accent"
                          : inv.status === "DECLINED"
                            ? "danger"
                            : "default"
                      }
                      variant={
                        inv.status === "ACCEPTED"
                          ? "soft"
                          : inv.status === "DECLINED"
                            ? "soft"
                            : "secondary"
                      }
                    >
                      {inv.status === "ACCEPTED" ? (
                        <CheckIcon className="size-3" />
                      ) : inv.status === "DECLINED" ? (
                        <XIcon className="size-3" />
                      ) : null}
                      {inv.status}
                    </Chip>
                  </div>
                  {inv.message && (
                    <p className="text-muted-foreground text-xs">
                      "{inv.message}"
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
