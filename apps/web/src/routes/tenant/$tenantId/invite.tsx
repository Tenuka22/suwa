import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { toast } from "sonner";
import { useState } from "react";
import {
  CheckIcon,
  SendIcon,
  XIcon,
} from "lucide-react";

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
      toast.error("Please enter a doctor ID");
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
      toast.error(
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
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Invite Doctor</h1>
        <p className="text-muted-foreground">
          Send invitations to doctors to join this hospital.
        </p>
      </div>

      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send New Invitation</CardTitle>
          <CardDescription>
            Enter the doctor's user ID to send them an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctorId">Doctor ID *</Label>
            <Input
              id="doctorId"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="Enter doctor's user ID..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
            />
          </div>
          <Button onClick={handleInvite} disabled={inviteDoctor.isPending}>
            <SendIcon className="mr-2 size-4" />
            {inviteDoctor.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </CardContent>
      </Card>

      {/* Invitation History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Invitation History</CardTitle>
            <CardDescription>
              Track all invitations sent for this hospital.
            </CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "ALL")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInvitations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No invitations found.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {inv.doctorName}
                      </p>
                      <Badge
                        variant={
                          inv.status === "ACCEPTED"
                            ? "default"
                            : inv.status === "DECLINED"
                              ? "destructive"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {inv.status === "ACCEPTED" ? (
                          <CheckIcon className="mr-1 size-3" />
                        ) : inv.status === "DECLINED" ? (
                          <XIcon className="mr-1 size-3" />
                        ) : null}
                        {inv.status}
                      </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
