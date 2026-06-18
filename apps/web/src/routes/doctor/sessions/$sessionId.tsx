import { Button } from "@heroui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { VideoRoomWeb } from "@/components/livekit/video-room";
import { useLiveKitToken } from "@/hooks/queries/doctor";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/doctor/sessions/$sessionId")({
  component: DoctorSessionDetailRoute,
});

function DoctorSessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const role = useRole();
  const userRole: "admin" | "doctor" = role === "admin" ? "admin" : "doctor";

  const sessionQuery = useLiveKitToken({ sessionId });

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
        <Button onPress={() => navigate({ to: "/doctor/sessions" })}>
          Back to Sessions
        </Button>
      </div>
    );
  }

  const session = sessionQuery.data.session;

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Button
          aria-label="Back to sessions"
          isIconOnly
          onPress={() => navigate({ to: "/doctor/sessions" })}
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
        <VideoRoomWeb
          endAt={session.endAt}
          onClose={() => navigate({ to: "/doctor/sessions" })}
          open={true}
          role={userRole}
          sessionId={sessionId}
          startAt={session.startAt}
        />
      </main>
    </div>
  );
}
