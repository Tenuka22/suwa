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
import { BuildingIcon, CheckIcon, ClockIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

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
          <CardTitle className="font-semibold text-lg tracking-tight">
            My Hospital Affiliations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const hasContent = affiliations.length > 0 || pendingInvitations.length > 0;

  return (
    <Card className="rounded-3xl border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-semibold text-lg tracking-tight">
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

      <CardContent className="flex flex-col gap-4">
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-medium text-amber-500 text-sm">
              Pending Invitations ({pendingInvitations.length})
            </p>
            {pendingInvitations.map((inv) => (
              <div
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5"
                key={inv.id}
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
                    disabled={respondInvitation.isPending}
                    onClick={() => handleRespond(inv.id, "ACCEPTED")}
                    size="sm"
                  >
                    <CheckIcon className="size-3" />
                    Accept
                  </Button>
                  <Button
                    disabled={respondInvitation.isPending}
                    onClick={() => handleRespond(inv.id, "DECLINED")}
                    size="sm"
                    variant="outline"
                  >
                    <XIcon className="size-3" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Affiliations */}
        {affiliations.length > 0 ? (
          <div className="flex flex-col gap-3">
            {affiliations.map((aff) => (
              <div className="rounded-xl border" key={aff.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="size-4 text-primary" />
                    <p className="font-medium text-sm">{aff.tenantName}</p>
                  </div>
                  <Badge
                    className="text-[10px]"
                    variant={
                      aff.status === "ACTIVE"
                        ? "default"
                        : aff.status === "INACTIVE"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {aff.status}
                  </Badge>
                </div>
                {aff.tenantType && (
                  <p className="text-muted-foreground text-xs">
                    {aff.tenantType === "PRIVATE_HOSPITAL"
                      ? "Private Hospital"
                      : "Public Hospital"}
                  </p>
                )}
                {aff.availabilityWindows.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      <ClockIcon className="inline size-3" />
                      Availability:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {aff.availabilityWindows.map((w, i) => (
                        <Badge
                          className="text-[10px]"
                          key={i}
                          variant="outline"
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
