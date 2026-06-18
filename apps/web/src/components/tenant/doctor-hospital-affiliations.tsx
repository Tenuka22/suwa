"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  Separator,
  toast,
} from "@heroui/react";
import { BuildingIcon, CheckIcon, ClockIcon, XIcon } from "lucide-react";

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
      toast.danger("Failed to respond to invitation");
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
          <Chip color="default" variant="soft">
            {affiliations.length} active
          </Chip>
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
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
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
                    isDisabled={respondInvitation.isPending}
                    onPress={() => handleRespond(inv.id, "ACCEPTED")}
                    size="sm"
                  >
                    <CheckIcon className="size-3" />
                    Accept
                  </Button>
                  <Button
                    isDisabled={respondInvitation.isPending}
                    onPress={() => handleRespond(inv.id, "DECLINED")}
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
              <div className="rounded-xl border p-3" key={aff.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="size-4 text-primary" />
                    <p className="font-medium text-sm">{aff.tenantName}</p>
                  </div>
                  <Chip
                    className="text-[10px]"
                    color={
                      aff.status === "ACTIVE"
                        ? "accent"
                        : aff.status === "INACTIVE"
                          ? "default"
                          : "default"
                    }
                    variant={aff.status === "ACTIVE" ? "soft" : "tertiary"}
                  >
                    {aff.status}
                  </Chip>
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
                        <Chip
                          className="text-[10px]"
                          key={i}
                          variant="tertiary"
                        >
                          {DAYS[w.dayOfWeek]} {w.startTime}–{w.endTime}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          !hasContent && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <BuildingIcon className="size-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">No hospital affiliations</p>
                <p className="text-muted-foreground text-sm">
                  You haven't joined any hospitals yet. Invitations will appear
                  here.
                </p>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
