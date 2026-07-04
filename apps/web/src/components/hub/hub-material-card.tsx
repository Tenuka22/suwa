import { Badge } from "@suwa/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@suwa/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  ClockIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  FileAudioIcon,
  FilmIcon,
  LinkIcon,
  LockIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

interface HubMaterialCardProps {
  createdAt: string;
  durationSeconds?: number | null;
  fileType: "video" | "audio";
  id: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onVisibilityChange?: (
    id: string,
    visibility: "public" | "unlisted" | "private"
  ) => void;
  size?: number | null;
  status: "uploading" | "processing" | "ready" | "failed";
  tags?: string[] | null;
  title: string;
  visibility: "public" | "unlisted" | "private";
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1_073_741_824) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function VisibilityIcon({ visibility }: { visibility: string }) {
  switch (visibility) {
    case "public":
      return <EyeIcon className="size-3" />;
    case "unlisted":
      return <LinkIcon className="size-3" />;
    case "private":
      return <EyeOffIcon className="size-3" />;
    default:
      return <LockIcon className="size-3" />;
  }
}

export function HubMaterialCard({
  id,
  title,
  fileType,
  visibility,
  status,
  size,
  durationSeconds,
  createdAt,
  tags,
  onDelete,
  onEdit,
  onVisibilityChange,
}: HubMaterialCardProps) {
  const isVideo = fileType === "video";
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div className="group cursor-pointer">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted/20">
        {isVideo ? (
          <FilmIcon className="size-10 text-primary" />
        ) : (
          <FileAudioIcon className="size-10 text-primary" />
        )}

        {durationSeconds ? (
          <Badge
            className="absolute right-2 bottom-2 border-none bg-black/80 font-medium text-[11px] text-white"
            variant="outline"
          >
            {formatDuration(durationSeconds)}
          </Badge>
        ) : null}

        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Badge
              className="text-xs"
              variant={
                status === "failed" ? "destructive" : "secondary"
              }
            >
              {status === "uploading" && "Uploading..."}
              {status === "processing" && "Processing..."}
              {status === "failed" && "Failed"}
            </Badge>
          </div>
        )}

        <Badge
          className="absolute top-2 right-2 gap-1 bg-background/80 text-[10px] backdrop-blur"
          variant="outline"
        >
          <VisibilityIcon visibility={visibility} />
          {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
        </Badge>
      </div>

      <div className="flex gap-3 pt-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
          {isVideo ? (
            <FilmIcon className="size-4 text-primary" />
          ) : (
            <FileAudioIcon className="size-4 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-medium text-sm leading-snug text-foreground">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            {size ? <span>{formatFileSize(size)}</span> : null}
            {size && <span>&middot;</span>}
            <span>{timeAgo}</span>
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge className="text-[10px]" key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge className="text-[10px]" variant="secondary">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100">
            <EllipsisIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <PencilIcon className="size-4" />
                Edit details
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ClockIcon className="size-4" />
                Change visibility
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={visibility}
                  onValueChange={(value: string) =>
                    onVisibilityChange?.(
                      id,
                      value as "public" | "unlisted" | "private"
                    )
                  }
                >
                  <DropdownMenuRadioItem value="public">
                    <EyeIcon className="size-4" />
                    Public
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="unlisted">
                    <LinkIcon className="size-4" />
                    Unlisted
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="private">
                    <EyeOffIcon className="size-4" />
                    Private
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete?.(id)}
            >
              <Trash2Icon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
