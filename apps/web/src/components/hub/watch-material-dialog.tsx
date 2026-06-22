import { Chip, Modal, Skeleton } from "@heroui/react";
import { FileAudioIcon, FilmIcon } from "lucide-react";
import { useHubMaterialFile } from "@/hooks/hub/use-hub-material-file";
import { cn } from "@/lib/utils";

interface WatchMaterialDialogProps {
  material: {
    description?: string | null;
    fileType: "video" | "audio";
    id: string;
    tags?: string[] | null;
    title: string;
  } | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function LoadingSkeleton({ isVideo }: { isVideo: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton
        className={cn("w-full rounded-xl", isVideo ? "aspect-video" : "h-20")}
      />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="rounded-full bg-danger/10 p-4">
        <XIcon className="size-6 text-danger" />
      </div>
      <p className="font-medium text-sm">Failed to load file</p>
      <p className="max-w-xs text-muted-foreground text-xs">{error}</p>
    </div>
  );
}

function VideoPlayer({ fileUrl }: { fileUrl: string }) {
  return (
    <video
      className="w-full rounded-xl bg-black"
      controls
      preload="metadata"
      src={fileUrl}
    >
      <track kind="captions" label="No captions available" />
    </video>
  );
}

function AudioPlayer({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/20 p-6">
      <div className="flex items-center justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <FileAudioIcon className="size-8 text-primary" />
        </div>
      </div>
      <audio className="w-full" controls preload="metadata" src={fileUrl}>
        <track kind="captions" label="No captions available" />
      </audio>
    </div>
  );
}

function MaterialMeta({
  material,
}: {
  material: NonNullable<WatchMaterialDialogProps["material"]>;
}) {
  return (
    <>
      {material.description ? (
        <div className="flex flex-col gap-1">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Description
          </p>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {material.description}
          </p>
        </div>
      ) : null}

      {material.tags && material.tags.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {material.tags.map((tag) => (
              <Chip
                className="text-xs"
                color="default"
                key={tag}
                variant="soft"
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlayerContent({
  fileUrl,
  isVideo,
}: {
  fileUrl: string;
  isVideo: boolean;
}) {
  return isVideo ? (
    <VideoPlayer fileUrl={fileUrl} />
  ) : (
    <AudioPlayer fileUrl={fileUrl} />
  );
}

function DialogBody({
  isLoading,
  error,
  fileUrl,
  isVideo,
  material,
}: {
  error: string | null;
  fileUrl: string | null;
  isVideo: boolean;
  isLoading: boolean;
  material: WatchMaterialDialogProps["material"];
}) {
  if (isLoading) {
    return <LoadingSkeleton isVideo={isVideo} />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!fileUrl) {
    return null;
  }

  return (
    <>
      <PlayerContent fileUrl={fileUrl} isVideo={isVideo} />
      {material ? <MaterialMeta material={material} /> : null}
    </>
  );
}

export function WatchMaterialDialog({
  material,
  onOpenChange,
  open,
}: WatchMaterialDialogProps) {
  const { fileUrl, isLoading, error } = useHubMaterialFile(
    open ? (material?.id ?? null) : null
  );

  const isVideo = material?.fileType === "video";

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange} variant="blur">
      <Modal.Container>
        <Modal.Dialog
          className={cn(
            "flex max-h-[90vh] flex-col overflow-hidden bg-background",
            isVideo ? "sm:max-w-[720px]" : "sm:max-w-[480px]"
          )}
        >
          <Modal.CloseTrigger />
          <Modal.Header>
            <div className="flex min-w-0 items-center gap-3 pr-8">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {isVideo ? (
                  <FilmIcon className="size-5 text-primary" />
                ) : (
                  <FileAudioIcon className="size-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <Modal.Heading className="truncate font-semibold text-base">
                  {material?.title ?? "Loading..."}
                </Modal.Heading>
                <p className="text-muted-foreground text-xs">
                  {isVideo ? "Video" : "Audio"}
                </p>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4 overflow-y-auto">
            <DialogBody
              error={error}
              fileUrl={fileUrl}
              isVideo={isVideo}
              isLoading={isLoading}
              material={material}
            />
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
