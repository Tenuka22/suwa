"use client";

import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@zen-doc/ui/components/empty";
import { Separator } from "@zen-doc/ui/components/separator";
import { toast } from "sonner";
import {
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  XIcon,
} from "lucide-react";

import {
  useListDoctorAffiliations,
  useListDoctorInvitations,
  useRespondInvitation,
} from "@/hooks/queries/tenant";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DoctorHospitalAffiliations() {
  const { data: affiliationsData, isLoading: affLoading } =
    useListDoctorAffiliations();
  const { data: invitationsData, isLoading: invLoading } =
    useListDoctorInvitations();
  const respondInvitation = useRespondInvitation();

  const affiliations = affiliationsData?.affiliations ?? [];
  const pendingInvitations = (invitationsData?.invitations ?? []).filter(
    (i) => i.status === "PENDING"
  );

  const handleRespond = async (
    invitationId: string,
    action: "ACCEPTED" | "DECLINED"
  ) => {
    try {
      await respondInvitation.mutateAsync({
        invitationId,
        action,
        availabilityWindows:
          action === "ACCEPTED"
            ? [
                {
                  dayOfWeek: 1,
                  startTime: "09:00",
                  endTime: "17:00",
                },
              ]
            : undefined,
      });
      toast.success(
        action === "ACCEPTED"
          ? "Invitation accepted! You can now set your availability."
          : "Invitation declined."
      );
    } catch {
      toast.error("Failed to respond to invitation");
    }
  };

  if (affLoading || invLoading) {
    return (
      <Card className="rounded-3xl border-border/60">
        <CardHeader>
          <CardTitle className="text-base">My Hospital Affiliations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const hasContent =
    affiliations.length > 0 || pendingInvitations.length > 0;

  return (
    <Card className="rounded-3xl border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BuildingIcon className="size-4" />
              My Hospital Affiliations
            </CardTitle>
            <CardDescription>
              Your hospital memberships and pending invitations
            </CardDescription>
          </div>
          <Badge variant="secondary">{affiliations.length} active</Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-sm text-amber-500">
              Pending Invitations ({pendingInvitations.length})
            </p>
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <div>
                  <p className="font-medium text-sm">Hospital Invitation</p>
                  {inv.message && (
                    <p className="text-muted-foreground text-xs">
                      "{inv.message}"
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Received {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(inv.id, "ACCEPTED")}
                    disabled={respondInvitation.isPending}
                  >
                    <CheckIcon className="mr-1 size-3" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(inv.id, "DECLINED")}
                    disabled={respondInvitation.isPending}
                  >
                    <XIcon className="mr-1 size-3" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Affiliations */}
        {affiliations.length > 0 ? (
          <div className="space-y-3">
            {affiliations.map((aff) => (
              <div
                key={aff.id}
                className="rounded-xl border p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="size-4 text-primary" />
                    <p className="font-medium text-sm">{aff.tenantName}</p>
                  </div>
                  <Badge
                    variant={
                      aff.status === "ACTIVE"
                        ? "default"
                        : aff.status === "INACTIVE"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {aff.status}
                  </Badge>
                </div>
                {aff.tenantType && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    {aff.tenantType === "PRIVATE_HOSPITAL"
                      ? "Private Hospital"
                      : "Public Hospital"}
                  </p>
                )}
                {aff.availabilityWindows.length > 0 && (
                  <div className="mt-2">
                    <p className="text-muted-foreground text-xs mb-1">
                      <ClockIcon className="inline mr-1 size-3" />
                      Availability:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {aff.availabilityWindows.map((w, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {DAYS[w.dayOfWeek]} {w.startTime}–{w.endTime}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          !hasContent && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BuildingIcon />
                </EmptyMedia>
                <EmptyTitle>No hospital affiliations</EmptyTitle>
                <EmptyDescription>
                  You haven't joined any hospitals yet. Invitations will appear
                  here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        )}
      </CardContent>
    </Card>
  );
}
