import { Button, Card, Chip, Dropdown } from "@heroui/react";
import { type ClassValue, clsx } from "clsx";
import {
  Download,
  FileImage,
  FileText,
  MoreVertical,
  PlayCircle,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoctorFileItem {
  caption: string | null;
  fileKind: "portrait" | "qualification" | "intro_video" | "other";
  fileName: string;
  id: string;
  isVideo: boolean;
  mimeType: string;
  size: number;
}

interface DoctorFileCardProps {
  file: DoctorFileItem;
  isDeleting: boolean;
  onDelete: (id: string) => void;
  previewUrl: string | null;
}

function downloadFile(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.click();
}

function getPreviewRatio(fileKind: DoctorFileItem["fileKind"]): number {
  if (fileKind === "portrait") {
    return 1;
  }

  if (fileKind === "intro_video") {
    return 16 / 9;
  }

  return 4 / 3;
}

function getFileKindLabel(fileKind: DoctorFileItem["fileKind"]): string {
  if (fileKind === "portrait") {
    return "Portrait";
  }

  if (fileKind === "qualification") {
    return "Qualification";
  }

  if (fileKind === "intro_video") {
    return "Intro Video";
  }

  return "Other";
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  const kilobytes = size / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function getFileIcon(file: DoctorFileItem) {
  if (file.isVideo) {
    return <PlayCircle className="size-4" />;
  }

  if (file.mimeType.includes("image")) {
    return <FileImage className="size-4" />;
  }

  return <FileText className="size-4" />;
}

export function DoctorFileCard({
  file,
  isDeleting,
  onDelete,
  previewUrl,
}: DoctorFileCardProps) {
  let previewContent: ReactNode;

  if (!previewUrl) {
    previewContent = (
      <div className="flex h-full items-center justify-center bg-muted/20 text-muted-foreground text-xs">
        Loading preview...
      </div>
    );
  } else if (file.isVideo) {
    previewContent = (
      <video
        className="h-full w-full object-cover"
        controls
        preload="metadata"
        src={previewUrl}
      >
        <track kind="captions" label="Preview captions" />
      </video>
    );
  } else {
    previewContent = (
      <img
        alt={file.caption || file.fileName}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        height={240}
        src={previewUrl}
        width={320}
      />
    );
  }

  const handleDownload = () => {
    if (previewUrl) {
      downloadFile(previewUrl, file.fileName);
      return;
    }

    window.open(`/api/doctor-files/${file.id}`, "_blank", "noopener");
  };

  return (
    <Card className="group overflow-hidden border-border/60 bg-card transition-all duration-200 hover:border-border hover:shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border/50 bg-muted/30",
            file.isVideo
              ? "w-full sm:w-52"
              : file.fileKind === "portrait"
                ? "w-full sm:w-40"
                : "w-full sm:w-48"
          )}
        >
          <div
            className="overflow-hidden"
            style={{
              aspectRatio: getPreviewRatio(file.fileKind),
            }}
          >
            {previewContent}
          </div>

          <div className="absolute top-2 left-2">
            <Chip className="backdrop-blur-sm" color="default" variant="soft">
              <span className="flex items-center gap-1">
                {getFileIcon(file)}
                {getFileKindLabel(file.fileKind)}
              </span>
            </Chip>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="truncate font-medium text-sm">
                  {file.fileName}
                </h3>

                {file.caption ? (
                  <p className="line-clamp-2 text-muted-foreground text-sm">
                    {file.caption}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    No caption provided
                  </p>
                )}
              </div>

              <Dropdown>
                <Dropdown.Trigger>
                  <Button
                    className="shrink-0"
                    isIconOnly
                    size="sm"
                    variant="ghost"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "download") {
                        handleDownload();
                      }
                      if (key === "delete") {
                        onDelete(file.id);
                      }
                    }}
                  >
                    <Dropdown.Item id="download">
                      <Download className="size-4" />
                      Download
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-destructive"
                      id="delete"
                      isDisabled={isDeleting}
                    >
                      <Trash2 className="size-4" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip variant="tertiary">{formatFileSize(file.size)}</Chip>
              <Chip variant="tertiary">{file.mimeType || "unknown"}</Chip>
              {file.isVideo ? (
                <Chip color="default" variant="soft">
                  Video
                </Chip>
              ) : (
                <Chip color="default" variant="soft">
                  Image
                </Chip>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-border/50 border-t">
            <p className="truncate text-muted-foreground text-xs">
              ID: {file.id}
            </p>

            <Button
              isDisabled={isDeleting}
              onPress={() => onDelete(file.id)}
              size="sm"
              variant="danger"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
