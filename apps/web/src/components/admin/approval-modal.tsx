import { Button, Chip, Modal, ProgressBar, Spinner } from "@heroui/react";
import { UserCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

interface PendingDoctor {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  bio: string | null;
  displayName: string | null;
  completeness: number;
  permanent: boolean;
}

interface ApprovalModalProps {
  doctor: PendingDoctor;
  isApproving: boolean;
  onApprove: (userId: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function useFaceVideo(userId: string) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let objectUrl: string | null = null;

    const fetch = async () => {
      setLoading(true);
      try {
        const file = await orpc.getFaceVideo.call({ userId });
        if (file) {
          objectUrl = URL.createObjectURL(file);
          setVideoUrl(objectUrl);
        }
      } catch {
        setVideoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    void fetch();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [userId]);

  return { videoUrl, loading };
}

export function ApprovalModal({
  doctor,
  isApproving,
  onApprove,
  onOpenChange,
  open,
}: ApprovalModalProps) {
  const { videoUrl, loading: videoLoading } = useFaceVideo(doctor.userId);

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="max-h-[90vh] max-w-lg">
          <Modal.Header>
            <Modal.Icon className="bg-primary text-primary-foreground">
              <UserCheckIcon className="size-5" />
            </Modal.Icon>
            <Modal.Heading>Review Doctor Request</Modal.Heading>
            <p className="font-normal text-muted-foreground text-sm">
              Review doctor information, face verification, and approve their
              account
            </p>
          </Modal.Header>

          <Modal.Body>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="font-semibold text-lg">
                    {doctor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{doctor.name}</h2>
                  <p className="text-muted-foreground text-sm">
                    {doctor.displayName ?? "No display name"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {doctor.email && (
                  <Chip size="sm" variant="soft">
                    {doctor.email}
                  </Chip>
                )}
                {doctor.phone && (
                  <Chip size="sm" variant="soft">
                    {doctor.phone}
                  </Chip>
                )}
                <Chip color="warning" size="sm" variant="soft">
                  Pending review
                </Chip>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-foreground/70 text-xs">
                    Profile completeness
                  </span>
                  <span className="font-medium text-xs">
                    {doctor.completeness}%
                  </span>
                </div>
                <ProgressBar
                  aria-label="Profile completeness"
                  size="sm"
                  value={doctor.completeness}
                >
                  <ProgressBar.Track className="h-1.5">
                    <ProgressBar.Fill
                      className={
                        doctor.completeness >= 50
                          ? "bg-green-500"
                          : doctor.completeness >= 15
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }
                    />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>

              {doctor.bio && (
                <div>
                  <p className="mb-1 font-medium text-foreground/70 text-xs">
                    Bio
                  </p>
                  <p className="text-foreground/80 text-sm">{doctor.bio}</p>
                </div>
              )}

              {videoLoading ? (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <Spinner />
                </div>
              ) : videoUrl ? (
                <div>
                  <p className="mb-1 font-medium text-foreground/70 text-xs">
                    Face verification video
                  </p>
                  <video
                    className="w-full rounded-lg"
                    controls
                    src={videoUrl}
                  />
                </div>
              ) : null}
            </div>
          </Modal.Body>

          <Modal.Footer className="flex justify-end gap-3">
            <Button onPress={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button
              isDisabled={isApproving}
              onPress={() => onApprove(doctor.userId)}
              variant="primary"
            >
              {isApproving ? "Approving..." : "Approve Doctor"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
