import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clipboard,
  Eye,
  EyeOff,
  KeyRoundIcon,
  Loader2,
  LockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldIcon,
  User,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@suwa/ui/components/card";
import { Input } from "@suwa/ui/components/input";
import { VideoRoomWeb } from "@/components/livekit/video-room";
import { orpc } from "@/utils/orpc";
import {
  createSessionKeyPair,
  decryptData,
  deriveSharedKey,
  loadSessionKeyPair,
  saveSessionKeyPair,
} from "@/utils/privacy";

export const Route = createFileRoute("/admin/session")({
  component: AdminSessionPage,
});

function PrivacyChoiceModal({
  busy,
  onSelect,
  onClose,
  visible,
}: {
  busy: boolean;
  onSelect: (mode: "anonymous" | "show-info") => void;
  onClose: () => void;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <button
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
        <div className="mb-4 flex items-center gap-3">
          <ShieldIcon className="size-5 text-primary" />
          <div>
            <h2 className="font-semibold">Choose how to join</h2>
            <p className="text-sm text-muted-foreground">
              Join anonymously with audio only, or share your profile details with the doctor.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-muted/50 disabled:opacity-60"
            disabled={busy}
            onClick={() => onSelect("anonymous")}
            type="button"
          >
            <VideoOff className="size-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Stay anonymous</p>
              <p className="text-xs text-muted-foreground">Your camera stays off. Doctor gets audio only.</p>
            </div>
          </button>

          <button
            className="flex items-center gap-3 rounded-lg border p-4 text-left hover:bg-muted/50 disabled:opacity-60"
            disabled={busy}
            onClick={() => onSelect("show-info")}
            type="button"
          >
            <Video className="size-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Show info to doctor</p>
              <p className="text-xs text-muted-foreground">Enable video and share your saved details.</p>
            </div>
          </button>
        </div>

        {busy && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Joining session...
          </div>
        )}
      </div>
    </div>
  );
}

function PatientInfoBar({ sessionId }: { sessionId: string }) {
  const queryOptions: any = orpc.getSessionPatientInfo.queryOptions({
    input: { sessionId },
    enabled: !!sessionId,
    refetchInterval: 10000,
    meta: { ignoreError: true },
  });
  const query = useQuery(queryOptions);
  const info = query.data as { alias: string; ageCategory: string; profession: string } | null;

  if (!info) return null;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <User className="size-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{info.alias}</span>
          <span className="text-muted-foreground">{info.ageCategory}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{info.profession}</span>
        </div>
        <Badge variant="outline" className="ml-auto text-xs">Shared publicly</Badge>
      </CardContent>
    </Card>
  );
}

function SharedPatientDataPanel({ sessionId }: { sessionId: string }) {
  const [sessionKeyPair, setSessionKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [sharedPatientData, setSharedPatientData] = useState<Record<string, unknown> | null>(null);
  const [sharedDataStatus, setSharedDataStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [showDetails, setShowDetails] = useState(false);

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

  const doctorPublicKey = (doctorPublicKeyQuery.data as { publicKey: string } | null)?.publicKey ?? null;
  const sharedData = sharedDataQuery.data as { encryptedData: string; patientPublicKey: string } | null;

  useEffect(() => {
    if (!sessionId) return;
    const storedPair = loadSessionKeyPair(sessionId);
    if (storedPair) {
      setSessionKeyPair(storedPair);
      if (!doctorPublicKey) {
        orpc.storeDoctorPublicKey.call({ sessionId, publicKey: storedPair.publicKey }).catch(() => undefined);
      }
      return;
    }
    if (doctorPublicKey) {
      setSessionKeyPair(null);
      return;
    }
    createSessionKeyPair(sessionId).then((pair) => {
      setSessionKeyPair(pair);
      saveSessionKeyPair(sessionId, pair);
      orpc.storeDoctorPublicKey.call({ sessionId, publicKey: pair.publicKey }).catch(() => undefined);
    });
  }, [doctorPublicKey, sessionId]);

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
        const sharedKey = await deriveSharedKey(sessionKeyPair.privateKey, sharedData.patientPublicKey);
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
    decryptSharedData();
    return () => { cancelled = true; };
  }, [sessionKeyPair, sharedData]);

  const sharedDetails: Array<[string, string]> = [];
  if (sharedPatientData) {
    for (const [label, value] of [
      ["Full name", sharedPatientData.fullName],
      ["Email", sharedPatientData.email],
      ["Phone", sharedPatientData.phone],
      ["Address", sharedPatientData.address],
      ["Age category", sharedPatientData.ageCategory],
      ["Profession", sharedPatientData.profession],
    ] as Array<[string, unknown]>) {
      if (value !== undefined && value !== null && value !== "") {
        sharedDetails.push([label, String(value)]);
      }
    }
  }

  const statusIcon = {
    idle: <LockIcon className="size-4 text-muted-foreground" />,
    loading: <Loader2 className="size-4 animate-spin text-muted-foreground" />,
    ready: <ShieldCheckIcon className="size-4 text-emerald-500" />,
    error: <ShieldAlertIcon className="size-4 text-destructive" />,
  }[sharedDataStatus];

  const statusLabel = {
    idle: "No data shared yet",
    loading: "Decrypting...",
    ready: "Data available",
    error: "Decryption failed",
  }[sharedDataStatus];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-primary" />
            <CardTitle className="text-sm">Patient shared data</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {statusIcon}
            {statusLabel}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sharedDataStatus === "ready" && sharedDetails.length > 0 && (
          <>
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowDetails(!showDetails)}
              type="button"
            >
              {showDetails ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {showDetails ? "Hide details" : "View details"}
            </button>
            {showDetails && (
              <div className="grid gap-2 sm:grid-cols-2">
                {sharedDetails.map(([label, value]) => (
                  <div className="rounded-md border p-2" key={label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {sharedDataStatus === "ready" && sharedDetails.length === 0 && (
          <p className="text-xs text-muted-foreground">No personal details were shared.</p>
        )}
        {sharedDataStatus === "loading" && (
          <p className="text-xs text-muted-foreground">Attempting to decrypt patient data...</p>
        )}
        {sharedDataStatus === "idle" && (
          <p className="text-xs text-muted-foreground">Waiting for patient to share their encrypted profile.</p>
        )}
        {sharedDataStatus === "error" && (
          <p className="text-xs text-destructive">Could not decrypt shared data. Session keys may have changed.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AdminSessionPage() {
  const { user } = useUser();
  const [sessionId, setSessionId] = useState("");
  const [generatedSessionId, setGeneratedSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: string; startAt: string; endAt: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | "admin">("doctor");

  if (!user) return null;

  const isAdmin = user.publicMetadata?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <ShieldIcon className="size-8 text-muted-foreground" />
            <p className="font-medium">Unauthorized</p>
            <p className="text-sm text-muted-foreground">You do not have admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
        <PrivacyChoiceModal
          busy={false}
          onClose={() => setPrivacyModalOpen(false)}
          onSelect={() => { setPrivacyModalOpen(false); }}
          visible={privacyModalOpen}
        />

        <div className="flex items-center gap-2">
          <Badge variant="outline">Live session</Badge>
          <Badge variant="secondary">{selectedRole}</Badge>
          {isMock && <Badge variant="secondary">Mock mode</Badge>}
        </div>

        <div className="flex min-h-0 flex-1 gap-4">
          <div className="flex-1 overflow-hidden rounded-lg border bg-black">
            <VideoRoomWeb
              compact
              endAt={activeSession.endAt}
              isMock={isMock}
              onClose={() => { setActiveSession(null); setIsMock(false); }}
              onFetchToken={(sid) => orpc.getTestLiveKitToken.call({ sessionId: sid })}
              role={selectedRole}
              sessionId={activeSession.id}
              startAt={activeSession.startAt}
            />
          </div>

          {!isMock && selectedRole !== "patient" && (
            <div className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto">
              <PatientInfoBar sessionId={activeSession.id} />
              <SharedPatientDataPanel sessionId={activeSession.id} />
            </div>
          )}

          {selectedRole === "patient" && (
            <div className="flex w-64 shrink-0 flex-col gap-4">
              <Button onClick={() => setPrivacyModalOpen(true)} variant="outline">
                <ShieldIcon className="mr-2 size-4" />
                Change join preference
              </Button>
            </div>
          )}
        </div>

        {isMock && (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            Mock simulation active — no LiveKit credits used.
          </div>
        )}
      </div>
    );
  }

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const result = await orpc.createTestSession.call({});
      setGeneratedSessionId(result.sessionId);
      setSessionId(result.sessionId);
    } catch {
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!sessionId) return;
    if (selectedRole === "doctor" || selectedRole === "admin") {
      setActiveSession({
        id: sessionId,
        startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      return;
    }
    setPrivacyModalOpen(true);
  };

  const handlePrivacySelect = (_mode: "anonymous" | "show-info") => {
    setPrivacyModalOpen(false);
    setActiveSession({
      id: sessionId,
      startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PrivacyChoiceModal
        busy={false}
        onClose={() => setPrivacyModalOpen(false)}
        onSelect={handlePrivacySelect}
        visible={privacyModalOpen}
      />

      <div>
        <h1 className="text-xl font-semibold">Session workspace</h1>
        <p className="text-sm text-muted-foreground">Create a room, choose a role, and join the session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Step 1 — Generate session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button disabled={isCreating} onClick={handleCreateSession}>
            {isCreating ? "Creating..." : "Generate Session ID"}
          </Button>

          {generatedSessionId ? (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <code className="break-all font-mono text-xs">{generatedSessionId}</code>
              <Button onClick={handleCopy} size="sm" variant="outline">
                <Clipboard className="mr-2 size-3.5" />
                {copied ? "Copied!" : "Copy session ID"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Generated ID will appear here.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Step 2 — Join session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Paste or type session ID..."
            value={sessionId}
          />

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
            <div className="grid grid-cols-3 gap-2">
              {(["patient", "doctor", "admin"] as const).map((role) => (
                <button
                  className={`rounded-md border p-3 text-left text-xs transition-colors ${
                    selectedRole === role
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  type="button"
                >
                  <p className="font-medium capitalize">{role}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" disabled={!sessionId} onClick={handleJoin}>
              <Video className="mr-2 size-4" />
              Join as {selectedRole}
            </Button>
            <Button
              onClick={() => {
                setIsMock(true);
                setPrivacyModalOpen(false);
                setActiveSession({
                  id: "mock-session",
                  startAt: new Date().toISOString(),
                  endAt: new Date(Date.now() + 3_600_000).toISOString(),
                });
              }}
              variant="secondary"
            >
              Mock
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
