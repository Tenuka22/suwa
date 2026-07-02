import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@suwa/ui/components/dialog";
import { Input } from "@suwa/ui/components/input";
import { Label } from "@suwa/ui/components/label";
import { Progress } from "@suwa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Textarea } from "@suwa/ui/components/textarea";
import {
  EyeIcon,
  EyeOffIcon,
  FileAudioIcon,
  FileVideoIcon,
  LinkIcon,
  PauseIcon,
  PlayIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { UploadProgress } from "@/hooks/hub/use-chunked-upload";
import { useChunkedUpload } from "@/hooks/hub/use-chunked-upload";
import { useHubChannels } from "@/hooks/hub/use-hub";
import { isAudioFile, isVideoFile } from "@/utils/video-thumbnail";

interface UploadWizardDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const VISIBILITY_OPTIONS = [
  {
    value: "private" as const,
    label: "Private",
    icon: EyeOffIcon,
    description: "Only you can see this",
  },
  {
    value: "unlisted" as const,
    label: "Unlisted",
    icon: LinkIcon,
    description: "Anyone with the link can view",
  },
  {
    value: "public" as const,
    label: "Public",
    icon: EyeIcon,
    description: "Anyone can discover and view",
  },
];

type WizardStep = "select" | "details" | "uploading" | "done";

export function UploadWizardDialog({
  open,
  onOpenChange,
}: UploadWizardDialogProps) {
  const [step, setStep] = useState<WizardStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<
    "public" | "unlisted" | "private"
  >("private");
  const [channelId, setChannelId] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: channels } = useHubChannels();
  const channelOptions: Array<{ id: string; name: string }> = Array.isArray(
    channels
  )
    ? channels
    : [];
  const { progress, startUpload, pauseUpload, resetUpload } = useChunkedUpload({
    onComplete: () => setStep("done"),
  });

  const reset = useCallback(() => {
    setStep("select");
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setTags("");
    setVisibility("private");
    setChannelId("");
    resetUpload();
  }, [resetUpload]);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        reset();
      }
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const isVideo = isVideoFile(file);
      const isAudio = isAudioFile(file);

      if (!(isVideo || isAudio)) {
        return;
      }

      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      setStep("details");
    },
    [title]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleStartUpload = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    const fileType = isVideoFile(selectedFile) ? "video" : "audio";

    setStep("uploading");
    await startUpload(selectedFile, {
      fileType,
      title: title.trim() || selectedFile.name,
      channelId: channelId || undefined,
      visibility,
    });
  }, [selectedFile, title, channelId, visibility, startUpload]);

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1_073_741_824) {
      return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
    }
    if (bytes >= 1_048_576) {
      return `${(bytes / 1_048_576).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatProgress = (p: UploadProgress | null) => {
    if (!p) {
      return { percent: 0, text: "Preparing..." };
    }
    const percent = Math.round(p.progress * 100);
    const uploadedBytes =
      (p.uploadedChunks / p.totalChunks) * (selectedFile?.size ?? 0);
    return {
      percent,
      text: `${formatFileSize(uploadedBytes)} / ${formatFileSize(selectedFile?.size ?? 0)} (${percent}%)`,
    };
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-medium text-sm">
            {step === "select" && "Upload video or audio"}
            {step === "details" && "Video details"}
            {step === "uploading" && "Uploading..."}
            {step === "done" && "Upload complete!"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" &&
              "Select a video or audio file to upload to your hub."}
            {step === "details" && "Add details about your content."}
            {step === "uploading" &&
              "Your file is being uploaded. You can pause and resume later if needed."}
            {step === "done" &&
              "Your content has been uploaded and is being processed."}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Select File */}
        {step === "select" && (
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-primary/50"
            }`}
            onDragLeave={() => setDragOver(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDrop={handleDrop}
          >
            <UploadIcon className="size-12 text-muted-foreground" />
            <p className="font-medium text-sm">Drag and drop your file here</p>
            <p className="text-muted-foreground text-sm">
              Videos and audio files supported
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              Browse files
            </Button>
            <input
              accept="video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              }}
              ref={fileInputRef}
              type="file"
            />
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && selectedFile && (
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
              {isVideoFile(selectedFile) ? (
                <FileVideoIcon className="size-8 text-primary" />
              ) : isAudioFile(selectedFile) ? (
                <FileAudioIcon className="size-8 text-primary" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {selectedFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(selectedFile.size)} &middot;{" "}
                  {selectedFile.type}
                </p>
              </div>
              <Button
                className="size-8"
                onClick={() => {
                  setSelectedFile(null);
                  setStep("select");
                }}
                size="icon"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="upload-title">Title</Label>
              <Input
                id="upload-title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your content"
                value={title}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="upload-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="upload-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your content..."
                rows={3}
                value={description}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="upload-tags">
                Tags{" "}
                <span className="text-muted-foreground">
                  (optional, comma-separated)
                </span>
              </Label>
              <Input
                id="upload-tags"
                onChange={(e) => setTags(e.target.value)}
                placeholder="therapy, anxiety, CBT"
                value={tags}
              />
            </div>

            {channelOptions.length > 0 ? (
              <div className="grid gap-2">
                <Label>Channel</Label>
                <Select
                  onValueChange={(v) => setChannelId(v ?? "")}
                  value={channelId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channelOptions.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>
                        {ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Visibility</Label>
              <div className="grid gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    className={`flex items-center gap-3 rounded-lg border text-left transition-colors ${
                      visibility === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-border"
                    }`}
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    type="button"
                  >
                    <opt.icon className="size-4 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Uploading */}
        {step === "uploading" && progress && (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium text-sm">
                  {progress.fileName}
                </p>
                <Badge variant="secondary">
                  {progress.status === "paused"
                    ? "Paused"
                    : progress.status === "error"
                      ? "Failed"
                      : progress.status === "completing"
                        ? "Processing..."
                        : "Uploading"}
                </Badge>
              </div>

              <Progress value={formatProgress(progress).percent} />

              <p className="text-muted-foreground text-sm">
                {formatProgress(progress).text}
              </p>

              {progress.status === "error" && progress.error && (
                <p className="text-destructive text-sm">{progress.error}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {progress.status === "uploading" && (
                <Button
                  className="gap-2"
                  onClick={pauseUpload}
                  size="sm"
                  variant="outline"
                >
                  <PauseIcon className="size-4" />
                  Pause
                </Button>
              )}
              {progress.status === "paused" && (
                <Button className="gap-2" size="sm" variant="outline">
                  <PlayIcon className="size-4" />
                  Resume
                </Button>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              You can close this dialog and resume the upload later from the hub
              page. Uploads that are interrupted can be continued from where
              they left off.
            </p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <FileVideoIcon className="size-8 text-primary" />
            </div>
            <p className="font-medium">
              Your content has been uploaded successfully!
            </p>
            <p className="text-center text-muted-foreground text-sm">
              It will appear in your hub once processing is complete.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "details" && (
            <>
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setStep("select");
                }}
                variant="outline"
              >
                Back
              </Button>
              <Button
                className="gap-2"
                disabled={!(title.trim() && selectedFile)}
                onClick={handleStartUpload}
              >
                <UploadIcon className="size-4" />
                Upload
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => handleClose(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
