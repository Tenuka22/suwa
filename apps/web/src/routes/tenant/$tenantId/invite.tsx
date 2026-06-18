import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  Skeleton,
  TextArea,
  toast,
} from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, SendIcon, XIcon } from "lucide-react";
import { useState } from "react";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-lg tracking-tight">Invite Doctor</h1>
        <p className="text-muted-foreground">
          Send invitations to doctors to join this hospital.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="text-base">Send New Invitation</Card.Title>
          <Card.Description>
            Enter the doctor's user ID to send them an invitation.
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
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
        </Card.Content>
      </Card>

      <Card>
        <Card.Header className="flex flex-row items-center justify-between">
          <div>
            <Card.Title className="text-base">Invitation History</Card.Title>
            <Card.Description>
              Track all invitations sent for this hospital.
            </Card.Description>
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
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInvitations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              No invitations found.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredInvitations.map((inv) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
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
        </Card.Content>
      </Card>
    </div>
  );
}
