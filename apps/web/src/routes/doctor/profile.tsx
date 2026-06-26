import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Chip, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

import { FaceCaptureDialog } from "@/components/face-detection";
import { DoctorProfileCard } from "@/components/doctors";
import { BodyText, PageTitle } from "@/components/typography";
import { orpc } from "@/utils/orpc";

type DoctorProfileState = {
  hasFaceEmbedding: boolean;
  permanent: boolean;
  profileExists: boolean;
};

export const Route = createFileRoute("/doctor/profile")({
  component: DoctorProfilePage,
});

function DoctorProfilePage() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DoctorProfileState | null>(null);
  const [role, setRole] = useState<string>("user");
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);

  const saveFaceMutation = useMutation(
    orpc.saveFaceEmbedding.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.doctorProfile.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.profileStats.queryKey(),
        });
      },
    })
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([orpc.doctorProfile.call(), orpc.profileStats.call()])
      .then(([profile, stats]) => {
        if (!mounted) return;
        setState({
          hasFaceEmbedding: !!profile?.profile?.hasFaceEmbedding,
          permanent: !!stats?.isPermanent,
          profileExists: !!stats?.profileExists,
        });
        setRole(profile?.role ?? "user");
      })
      .catch(() => {
        if (mounted) setState(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const status = !state
    ? "loading"
    : !state.profileExists
      ? "missing"
      : !state.permanent
        ? "pending"
        : !state.hasFaceEmbedding
          ? "verify"
          : "accepted";

  console.log("[doctor/profile] access state", {
    state,
    status,
    role,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <PageTitle>Doctor Access</PageTitle>
        <BodyText className="max-w-2xl">
          Complete your profile, verify your identity, and request review to
          unlock the rest of the doctor portal.
        </BodyText>
      </div>

      <Card className="rounded-2xl">
        <Card.Content className="flex flex-col gap-4 px-6 pb-6 pt-0">
          <div className="flex items-center gap-3">
            {status === "accepted" ? (
              <CheckCircle2 className="size-6 text-emerald-500" />
            ) : status === "verify" ? (
              <ShieldAlert className="size-6 text-amber-500" />
            ) : (
              <AlertCircle className="size-6 text-rose-500" />
            )}
            <div>
              <h2 className="font-medium text-base">
                {status === "loading"
                  ? "Checking access..."
                  : status === "missing"
                    ? "Profile missing"
                    : status === "pending"
                      ? "Awaiting approval"
                      : status === "verify"
                        ? "Face verification required"
                        : "Access approved"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {status === "loading"
                  ? "Please wait while we check your doctor account."
                  : status === "missing"
                    ? "Create your profile and submit it for review."
                    : status === "pending"
                      ? "Your profile is submitted and waiting for admin review."
                      : status === "verify"
                        ? "Your profile exists, but face verification is still required."
                        : "You can now use all doctor session features."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip color={status === "accepted" ? "success" : "default"} variant="soft">
              {status}
            </Chip>
            <Chip color="default" variant="soft">
              role: {role}
            </Chip>
            <Chip color={state?.permanent ? "success" : "warning"} variant="soft">
              {state?.permanent ? "accepted" : "not accepted"}
            </Chip>
            <Chip color={state?.hasFaceEmbedding ? "success" : "warning"} variant="soft">
              {state?.hasFaceEmbedding ? "face verified" : "face missing"}
            </Chip>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onPress={() => setFaceDialogOpen(true)} variant="secondary">
              {state?.hasFaceEmbedding ? "Update Face Verification" : "Verify Face"}
            </Button>
          </div>
        </Card.Content>
      </Card>

      {status !== "accepted" ? (
        <Alert color="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              You cannot access other doctor pages until your profile is verified
              and approved.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Profile submission</PageTitle>
          <BodyText className="max-w-2xl">
            Fill out your profile to create or update your review request.
          </BodyText>
        </div>

        <DoctorProfileCard />
      </section>

      <div className="flex justify-end">
        <Button onPress={() => window.location.reload()} variant="secondary">
          Refresh status
        </Button>
      </div>

      <FaceCaptureDialog
        open={faceDialogOpen}
        onOpenChange={setFaceDialogOpen}
        onFaceCaptured={async (result) => {
          await saveFaceMutation.mutateAsync(result);
          setFaceDialogOpen(false);
        }}
      />
    </div>
  );
}
