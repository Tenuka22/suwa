import { useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@zen-doc/ui/components/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { VideoRoomWeb } from "@/components/livekit/video-room";
import { getMetadataRole } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/sessions/$sessionId")({
  component: DoctorSessionDetailRoute,
});

function DoctorSessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const metadataRole = getMetadataRole(user?.publicMetadata);
  const userRole = metadataRole === "admin" ? "admin" : "doctor";

  const sessionQuery = useQuery({
    queryKey: orpc.getLiveKitToken.queryKey({ sessionId }),
    queryFn: () => orpc.getLiveKitToken.call({ sessionId }),
  });

  if (sessionQuery.isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4">
        <p className="text-destructive">Failed to load session</p>
        <Button onClick={() => navigate({ to: "/doctor/sessions" })}>
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
          onClick={() => navigate({ to: "/doctor/sessions" })}
          size="icon"
          variant="ghost"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold text-lg">Session Room</h1>
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
