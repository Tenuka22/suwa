import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { buildHeadFromKey } from "../__root";
import {
  Camera,
  ClipboardIcon,
  Loader2,
  LockIcon,
  Mic,
  ShieldIcon,
  UserX,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@suwa/ui/components/avatar";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@suwa/ui/components/card";
import { ScrollArea } from "@suwa/ui/components/scroll-area";
import { Separator } from "@suwa/ui/components/separator";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@suwa/ui/components/table";
import { Textarea } from "@suwa/ui/components/textarea";
import { Toggle } from "@suwa/ui/components/toggle";
import { useLiveKitRoomWeb } from "@/hooks/use-livekit-room";
import { authClient } from "@/utils/auth";
import { orpc } from "@/utils/orpc";
import {
  createSessionKeyPair,
  decryptData,
  deriveSharedKey,
  loadSessionKeyPair,
  saveSessionKeyPair,
} from "@/utils/privacy";

export const Route = createFileRoute("/admin/session")({
  head: () => buildHeadFromKey("web:admin:sessions:detail"),
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function connectionBadgeVariant(quality: string | undefined) {
  if (quality === "excellent" || quality === "good") return "default" as const;
  if (quality === "poor") return "destructive" as const;
  return "secondary" as const;
}

function isPatientIdentity(identity?: string) {
  return typeof identity === "string" && identity.startsWith("patient_");
}

function SessionFullscreen({
  activeSession,
  sessionId,
  onEnd,
}: {
  activeSession: { id: string; startAt: string; endAt: string };
  sessionId: string;
  onEnd: () => void;
}) {
  const liveKit = useLiveKitRoomWeb();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaved, setNotesSaved] = useState("");
  const [patientAmplitude, setPatientAmplitude] = useState(0);
  const [audioBars, setAudioBars] = useState<number[]>(Array.from({ length: 24 }, () => 0));
  const animationFrame = useRef<number | null>(null);

  const patientInfoQuery = useQuery(
    orpc.getSessionPatientInfo.queryOptions({
      input: { sessionId },
      enabled: !!sessionId,
      refetchInterval: 10000,
      meta: { ignoreError: true },
    }) as any
  );
  const doctorPublicKeyQuery = useQuery(
    orpc.getDoctorPublicKey.queryOptions({
      input: { sessionId },
      enabled: !!sessionId,
      refetchInterval: 5000,
      meta: { ignoreError: true },
    }) as any
  );
  const sharedDataQuery = useQuery(
    orpc.getSharedPatientData.queryOptions({
      input: { sessionId },
      enabled: !!sessionId,
      refetchInterval: 5000,
      meta: { ignoreError: true },
    }) as any
  );

  const patientInfo = patientInfoQuery.data as
    | {
        alias: string;
        ageCategory: string;
        profession: string;
        sex?: string;
        profileType?: string;
        visibility?: string;
        sessionType?: string;
      }
    | null;
  const doctorPublicKey = (doctorPublicKeyQuery.data as { publicKey: string } | null)?.publicKey ?? null;
  const sharedData = sharedDataQuery.data as { encryptedData: string | null; patientPublicKey: string | null } | null;

  const [sessionKeyPair, setSessionKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [sharedPatientData, setSharedPatientData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - new Date(activeSession.startAt).getTime()) / 1000));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession.startAt]);

  useEffect(() => {
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
      if (!sharedData || !sessionKeyPair || !sharedData.encryptedData || !sharedData.patientPublicKey) {
        setSharedPatientData(null);
        return;
      }

      try {
        const sharedKey = await deriveSharedKey(sessionKeyPair.privateKey, sharedData.patientPublicKey);
        const decrypted = await decryptData(sharedData.encryptedData, sharedKey);
        if (!cancelled) setSharedPatientData(decrypted);
      } catch {
        if (!cancelled) setSharedPatientData(null);
      }
    }

    decryptSharedData();
    return () => {
      cancelled = true;
    };
  }, [sessionKeyPair, sharedData]);

  useEffect(() => {
    const room = liveKit.room;
    if (!room) return;

    const frame = () => {
      const participant = Array.from(room.remoteParticipants.values()).find((item) => isPatientIdentity(item.identity));
      const amplitude = participant?.audioLevel ?? 0;
      setPatientAmplitude(amplitude);
      setAudioBars((prev) => [...prev.slice(1), amplitude]);
      animationFrame.current = window.requestAnimationFrame(frame);
    };

    animationFrame.current = window.requestAnimationFrame(frame);
    return () => {
      if (animationFrame.current !== null) window.cancelAnimationFrame(animationFrame.current);
    };
  }, [liveKit.room]);

  useEffect(() => {
    if (liveKit.isConnected || liveKit.isConnecting) return;
    orpc.getLiveKitToken.call({ sessionId }).then((tokenData) => {
      liveKit.connect(tokenData.serverUrl, tokenData.token).catch(() => undefined);
    }).catch(() => undefined);
  }, [liveKit, sessionId]);

  const remoteParticipants = liveKit.room
    ? Array.from(liveKit.room.remoteParticipants.values()).filter(
        (item) => isPatientIdentity(item.identity) || item.identity.startsWith("doctor_")
      )
    : [];
  const remoteParticipant = remoteParticipants.find((item) => isPatientIdentity(item.identity)) ?? null;

  useEffect(() => {
    if (!liveKit.isConnected) return;
    const patientIdentity = remoteParticipant?.identity;
    if (patientIdentity) {
      liveKit.attachParticipantTracks(patientIdentity);
    }
    return () => {
      if (patientIdentity) {
        liveKit.detachParticipantTracks(patientIdentity);
      }
    };
  }, [liveKit.isConnected, remoteParticipant?.identity, liveKit.attachParticipantTracks, liveKit.detachParticipantTracks]);
  const sharedRows = useMemo(() => {
    const rows: Array<[string, string]> = [];
    if (!sharedPatientData) return rows;
    for (const [label, value] of [
      ["Full name", sharedPatientData.fullName],
      ["Email", sharedPatientData.email],
      ["Phone", sharedPatientData.phone],
      ["Address", sharedPatientData.address],
      ["Age category", sharedPatientData.ageCategory],
      ["Profession", sharedPatientData.profession],
    ] as Array<[string, unknown]>) {
      if (value !== undefined && value !== null && value !== "") rows.push([label, String(value)]);
    }
    return rows;
  }, [sharedPatientData]);

  const endSession = async () => {
    await liveKit.disconnect();
    onEnd();
  };

  const main = (
    <div className="fixed inset-0 z-[9999] h-svh w-screen overflow-hidden bg-background">
      <div className="grid h-full grid-rows-[56px_1fr]">
        <div className="flex items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <Badge className="animate-pulse bg-destructive text-destructive-foreground" variant="destructive">
              LIVE
            </Badge>
            <Badge variant="outline">{formatTime(elapsedSeconds)}</Badge>
            <Badge variant="secondary">{patientInfo?.alias ?? "Patient"}</Badge>
            <Badge variant="outline">{patientInfo?.ageCategory ?? "Age"}</Badge>
            <Badge variant="outline">{patientInfo?.profession ?? "Category"}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Toggle aria-label="Microphone" pressed={true} size="sm" variant="outline">
              <Mic className="size-3.5" />
            </Toggle>
            <Toggle aria-label="Camera" pressed={true} size="sm" variant="outline">
              <Camera className="size-3.5" />
            </Toggle>
            <Button className="gap-2" onClick={endSession} variant="destructive">
              <VideoOff className="size-4" />
              End call
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-[1fr_380px]">
          <div className="relative min-h-0 overflow-hidden bg-black">
            {remoteParticipant ? (
              <video
                autoPlay
                className="h-full w-full object-cover"
                playsInline
                ref={liveKit.videoRef}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6">
                <Card className="w-full max-w-sm border-border/60 bg-background/80">
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <UserX className="size-12 text-muted-foreground" />
                    <p className="font-medium text-lg">Waiting for patient…</p>
                    <p className="text-sm text-muted-foreground">
                      The session is live and ready for the patient to join.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="absolute bottom-4 right-4 w-48 overflow-hidden rounded-xl border bg-background/90 shadow-lg ring-1 ring-border">
              <video
                autoPlay
                className="aspect-video w-full object-cover"
                muted
                playsInline
                ref={liveKit.localVideoRef}
              />
            </div>

          </div>

          <ScrollArea className="h-full border-l bg-background">
            <div className="flex flex-col gap-3 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Patient Info</CardTitle>
                  <CardDescription>
                    {patientInfo?.alias ?? "Patient"}
                    {patientInfo?.sex ? ` · ${patientInfo.sex}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{patientInfo?.profileType ?? "adult/minor"}</Badge>
                    <Badge variant="secondary">{patientInfo?.visibility ?? "shared publicly"}</Badge>
                    <Badge variant="default">{patientInfo?.sessionType ?? "session"}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{(patientInfo?.alias ?? "P").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{patientInfo?.alias ?? "Patient"}</div>
                      <div className="text-muted-foreground">
                        {patientInfo?.ageCategory ?? "Age category"}
                        {patientInfo?.sex ? ` · ${patientInfo.sex}` : ""}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Shared Data</CardTitle>
                </CardHeader>
                <CardContent>
                  {sharedRows.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell className="font-medium">Field</TableCell>
                          <TableCell className="font-medium">Value</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sharedRows.map(([label, value]) => (
                          <TableRow key={label}>
                            <TableCell>{label}</TableCell>
                            <TableCell>{value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                      <LockIcon className="size-4" />
                      Waiting for patient to share their encrypted profile.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{formatTime(elapsedSeconds)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Participant joined</span>
                    <span>{remoteParticipant?.joinedAt ? new Date(remoteParticipant.joinedAt).toLocaleTimeString() : "Not joined"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Connection</span>
                    <Badge variant={connectionBadgeVariant(remoteParticipant?.connectionQuality)}>
                      {remoteParticipant?.connectionQuality ?? "unknown"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Audio</span>
                    <span>{`Audio: ${Math.round(patientAmplitude * 100)}%`}</span>
                  </div>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">Patient audio</p>
                    <div className="flex items-end gap-1">
                      {audioBars.map((value, index) => (
                        <div
                          className={`w-2 rounded-full transition-all ${value > 0.15 ? "bg-primary" : "bg-muted"}`}
                          key={index}
                          style={{ height: `${Math.max(4, value * 40)}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session Notes</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Textarea
                    onBlur={() => setNotesSaved(notesDraft)}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add private notes..."
                    value={notesDraft}
                  />
                  <p className="text-xs text-muted-foreground">Not saved to record</p>
                  {notesSaved ? <p className="text-xs text-muted-foreground">Autosaved locally.</p> : null}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  return createPortal(main, document.body);
}

function AdminSessionPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [sessionId, setSessionId] = useState("");
  const [generatedSessionId, setGeneratedSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: string; startAt: string; endAt: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor">("doctor");

  if (!user) return null;
  if ((user as any).role !== "admin") {
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

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const result = await orpc.createTestSession.call({});
      setGeneratedSessionId(result.sessionId);
      setSessionId(result.sessionId);
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
    if (selectedRole === "patient") {
      setPrivacyModalOpen(true);
      return;
    }
    setActiveSession({
      id: sessionId,
      startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  };

  const handlePrivacySelect = () => {
    setPrivacyModalOpen(false);
    setActiveSession({
      id: sessionId,
      startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  };

  if (activeSession) {
    return (
      <SessionFullscreen
        activeSession={activeSession}
        onEnd={() => setActiveSession(null)}
        sessionId={activeSession.id}
      />
    );
  }

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
          <CardTitle className="text-sm">Step 1 - Generate session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button disabled={isCreating} onClick={handleCreateSession}>
            {isCreating ? "Creating..." : "Generate Session ID"}
          </Button>

          {generatedSessionId ? (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <code className="break-all font-mono text-xs">{generatedSessionId}</code>
              <Button onClick={handleCopy} size="sm" variant="outline">
                <ClipboardIcon className="mr-2 size-3.5" />
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
          <CardTitle className="text-sm">Step 2 - Join session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Paste or type session ID..."
            value={sessionId}
          />

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
            <div className="grid grid-cols-3 gap-2">
                  {(["patient", "doctor"] as const).map((role) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
