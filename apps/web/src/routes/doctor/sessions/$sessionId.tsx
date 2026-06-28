import { Alert, AlertDescription, AlertTitle } from "@suwa/ui/components/alert";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@suwa/ui/components/card";
import { Separator } from "@suwa/ui/components/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@suwa/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, KeyRoundIcon, Loader2, LockIcon, ShieldAlertIcon } from "lucide-react";

import { VideoRoomWeb } from "@/components/livekit/video-room";
import { useLiveKitToken } from "@/hooks/queries/doctor";
import { useRole } from "@/hooks/use-role";
import { orpc } from "@/utils/orpc";
import {
  createSessionKeyPair,
  decryptData,
  deriveSharedKey,
  loadSessionKeyPair,
  saveSessionKeyPair,
} from "@/utils/privacy";

export const Route = createFileRoute("/doctor/sessions/$sessionId")({
  component: DoctorSessionDetailRoute,
});

function DoctorSessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const role = useRole();
  const userRole: "admin" | "doctor" = role === "admin" ? "admin" : "doctor";

  const sessionQuery = useLiveKitToken({ sessionId });
  const doctorPublicKeyQueryOptions: any = orpc.getDoctorPublicKey.queryOptions({
    input: { sessionId },
    enabled: !!sessionId,
    refetchInterval: 5000,
    meta: { ignoreError: true },
  });
  const sharedDataQueryOptions: any = orpc.getSharedPatientData.queryOptions({
    input: { sessionId },
    enabled: !!sessionId,
    refetchInterval: 5000,
    meta: { ignoreError: true },
  });
  const doctorPublicKeyQuery = useQuery(doctorPublicKeyQueryOptions);
  const sharedDataQuery = useQuery(sharedDataQueryOptions);

  type SessionQueryData = { session: { endAt: string; startAt: string } };
  type PublicKeyQueryData = { publicKey: string } | null;
  type SharedDataQueryData = {
    encryptedData: string | null;
    patientPublicKey: string | null;
  } | null;

  function readField(value: unknown, key: string): unknown {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    for (const [entryKey, entryValue] of Object.entries(value)) {
      if (entryKey === key) {
        return entryValue;
      }
    }

    return undefined;
  }

  function normalizePublicKeyData(value: unknown): PublicKeyQueryData {
    const publicKey = readField(value, "publicKey");
    return typeof publicKey === "string" ? { publicKey } : null;
  }

  function normalizeSharedData(value: unknown): SharedDataQueryData {
    const encryptedData = readField(value, "encryptedData");
    const patientPublicKey = readField(value, "patientPublicKey");

    if (encryptedData === undefined && patientPublicKey === undefined) {
      return null;
    }

    return {
      encryptedData: typeof encryptedData === "string" ? encryptedData : null,
      patientPublicKey:
        typeof patientPublicKey === "string" ? patientPublicKey : null,
    };
  }

  function normalizeSessionData(value: unknown): SessionQueryData | null {
    const session = readField(value, "session");
    if (!session || typeof session !== "object") {
      return null;
    }

    const endAt = readField(session, "endAt");
    const startAt = readField(session, "startAt");

    if (typeof endAt !== "string" || typeof startAt !== "string") {
      return null;
    }

    return { session: { endAt, startAt } };
  }

  const doctorPublicKey = normalizePublicKeyData(doctorPublicKeyQuery.data);
  const sharedData = normalizeSharedData(sharedDataQuery.data);

  const [sessionKeyPair, setSessionKeyPair] = useState<{
    publicKey: string;
    privateKey: string;
  } | null>(null);
  const [sharedPatientData, setSharedPatientData] = useState<Record<string, unknown> | null>(null);
  const [sharedDataStatus, setSharedDataStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!sessionId || doctorPublicKeyQuery.isPending) {
      return;
    }

    const storedPair = loadSessionKeyPair(sessionId);
    if (storedPair) {
      setSessionKeyPair(storedPair);
      if (!doctorPublicKey?.publicKey) {
        void orpc.storeDoctorPublicKey
          .call({ sessionId, publicKey: storedPair.publicKey })
          .catch(() => undefined);
      }
      return;
    }

    if (doctorPublicKey?.publicKey) {
      setSessionKeyPair(null);
      return;
    }

    void createSessionKeyPair(sessionId).then((pair) => {
      setSessionKeyPair(pair);
      saveSessionKeyPair(sessionId, pair);
      void orpc.storeDoctorPublicKey
        .call({ sessionId, publicKey: pair.publicKey })
        .catch(() => undefined);
    });
  }, [doctorPublicKey?.publicKey, doctorPublicKeyQuery.isPending, sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function decryptSharedData() {
      if (!sharedData || !sessionKeyPair) {
        setSharedPatientData(null);
        setSharedDataStatus(sharedData ? "loading" : "idle");
        return;
      }

      if (!sharedData.encryptedData || !sharedData.patientPublicKey) {
        setSharedPatientData(null);
        setSharedDataStatus("idle");
        return;
      }

      setSharedDataStatus("loading");

      try {
        const sharedKey = await deriveSharedKey(
          sessionKeyPair.privateKey,
          sharedData.patientPublicKey
        );
        const decrypted = await decryptData(sharedData.encryptedData, sharedKey);
        if (!cancelled) {
          setSharedPatientData(decrypted);
          setSharedDataStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setSharedPatientData(null);
          setSharedDataStatus("error");
        }
      }
    }

    void decryptSharedData();

    return () => {
      cancelled = true;
    };
  }, [sessionKeyPair, sharedData]);

  const sharedDetails: Array<[string, string]> = [];
  if (sharedPatientData) {
    const details: Array<[string, unknown]> = [
      ["Full name", sharedPatientData.fullName],
      ["Email", sharedPatientData.email],
      ["Phone", sharedPatientData.phone],
      ["Address", sharedPatientData.address],
      ["Age category", sharedPatientData.ageCategory],
      ["Profession", sharedPatientData.profession],
    ];

    for (const [label, value] of details) {
      if (value !== undefined && value !== null && value !== "") {
        sharedDetails.push([label, String(value)]);
      }
    }
  }

  if (sessionQuery.isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div
        className="flex h-svh flex-col items-center justify-center gap-4"
        role="alert"
      >
        <p className="font-medium text-destructive">Failed to load session</p>
        <p className="text-muted-foreground text-sm">
          The video session could not be loaded. Please try again.
        </p>
        <Button onClick={() => navigate({ to: "/doctor/sessions" })}>
          Back to Sessions
        </Button>
      </div>
    );
  }

  const sessionData = normalizeSessionData(sessionQuery.data);

  if (!sessionData) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const session = sessionData.session;

  function renderSharedDataContent() {
    if (!sessionKeyPair) {
      return (
        <Alert>
          <ShieldAlertIcon />
          <AlertTitle>Key not available</AlertTitle>
          <AlertDescription>
            This browser does not have the local session key yet, so shared data cannot be decrypted.
          </AlertDescription>
        </Alert>
      );
    }

    if (sharedDataStatus === "loading") {
      return (
        <Alert>
          <Loader2 className="animate-spin" />
          <AlertTitle>Decrypting shared data...</AlertTitle>
          <AlertDescription>
            Please wait while the patient data is being decrypted.
          </AlertDescription>
        </Alert>
      );
    }

    if (sharedDataStatus === "error") {
      return (
        <Alert variant="destructive">
          <LockIcon />
          <AlertTitle>Decryption failed</AlertTitle>
          <AlertDescription>
            Could not decrypt the shared patient data.
          </AlertDescription>
        </Alert>
      );
    }

    if (sharedDetails.length === 0) {
      return (
        <Alert>
          <KeyRoundIcon />
          <AlertTitle>No data shared</AlertTitle>
          <AlertDescription>
            No patient details have been shared for this session yet.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sharedDetails.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell className="text-muted-foreground">{label}</TableCell>
              <TableCell className="font-medium">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Button
          aria-label="Back to sessions"
          onClick={() => navigate({ to: "/doctor/sessions" })}
          size="icon"
          variant="ghost"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg tracking-tight">Session Room</h1>
          <p className="text-muted-foreground text-xs">ID: {sessionId}</p>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <div className="grid h-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <VideoRoomWeb
            endAt={session.endAt}
            onClose={() => navigate({ to: "/doctor/sessions" })}
            open={true}
            role={userRole}
            sessionId={sessionId}
            startAt={session.startAt}
          />

          <Card className="h-full overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Shared session data</Badge>
                <Badge variant={sessionKeyPair ? "default" : "secondary"}>
                  {sessionKeyPair ? "Key ready" : "Key missing"}
                </Badge>
              </div>
              <CardTitle className="text-base">Anonymous patient details</CardTitle>
              <p className="text-muted-foreground text-sm">
                Decrypted data shared by the patient for this session.
              </p>
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-4 p-4">
              {renderSharedDataContent()}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
