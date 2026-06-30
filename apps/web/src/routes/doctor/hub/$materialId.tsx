import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@suwa/ui/components/avatar";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card, CardContent, CardHeader } from "@suwa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@suwa/ui/components/dropdown-menu";
import { Separator } from "@suwa/ui/components/separator";
import { buildHeadFromKey } from "../../__root";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeftIcon,
  EllipsisIcon,
  EyeIcon,
  FilmIcon,
  LinkIcon,
  LockIcon,
  PencilIcon,
  RadioIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { EditMaterialDialog } from "@/components/hub";
import { authClient } from "@/utils/auth";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor/hub/$materialId")({
  loader: async ({ context, params }) => {
    const material = await context.queryClient.ensureQueryData(
      orpc.getMaterial.queryOptions({ input: { id: params.materialId } })
    );
    return { material };
  },
  component: HubMaterialDetailPage,
});

function HubMaterialDetailPage() {
  const { material } = Route.useLoaderData();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [editOpen, setEditOpen] = useState(false);

  const name = user?.name ?? "Doctor";
  const timeAgo = formatDistanceToNow(new Date(material.createdAt), {
    addSuffix: true,
  });

  const isVideo = material.fileType === "video";

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
      />
      <div className="relative mx-auto max-w-[1400px] px-6 py-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="flex flex-col gap-4">
          {/* Back button */}
          <Link
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            to="/doctor/hub"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Hub
          </Link>

          {/* Video/Audio Player Area */}
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[2rem] border border-border/40 bg-black/5">
            {isVideo ? (
              <FilmIcon className="size-16 text-muted-foreground/30" />
            ) : (
              <RadioIcon className="size-16 text-muted-foreground/30" />
            )}
            {material.status !== "ready" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Badge
                  className="px-4 py-1 text-sm"
                  variant={
                    material.status === "failed" ? "destructive" : "secondary"
                  }
                >
                  {material.status === "uploading" && "Still uploading..."}
                  {material.status === "processing" && "Processing..."}
                  {material.status === "failed" && "Upload failed"}
                </Badge>
              </div>
            )}
          </div>

          {/* Title & Actions */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-semibold text-lg tracking-tight">
                  {material.title}
                </h1>
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Badge
                    className="gap-1"
                    variant={
                      material.visibility === "public" ? "default" : "secondary"
                    }
                  >
                    {material.visibility === "public" && (
                      <EyeIcon className="size-3" />
                    )}
                    {material.visibility === "unlisted" && (
                      <LinkIcon className="size-3" />
                    )}
                    {material.visibility === "private" && (
                      <LockIcon className="size-3" />
                    )}
                    {material.visibility.charAt(0).toUpperCase() +
                      material.visibility.slice(1)}
                  </Badge>
                  <span>{timeAgo}</span>
                  {material.size && (
                    <>
                      <span>&middot;</span>
                      <span>{(material.size / 1_048_576).toFixed(1)} MB</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="h-12 gap-2 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
                  size="sm"
                  variant="outline"
                >
                  <ShareIcon className="size-4" />
                  Share
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button size="icon" variant="ghost">
                      <EllipsisIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <PencilIcon className="mr-2 size-4" />
                      Edit details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <EyeIcon className="mr-2 size-4" />
                      Change visibility
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2Icon className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <Separator />

          {/* Channel Info */}
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="font-semibold text-sm">
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{name}</p>
              <p className="text-muted-foreground text-xs">
                {isVideo ? "Video" : "Audio"} &middot;{" "}
                {new Date(material.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          {material.description && (
            <Card className="overflow-hidden rounded-[1.2rem] border-border/90 bg-card/80 shadow-sm backdrop-blur-md">
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {material.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {material.tags &&
            Array.isArray(material.tags) &&
            material.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(material.tags as string[]).map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
        </div>

        {/* Sidebar - Related/Playlists */}
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader className="pb-3">
              <h3 className="font-medium text-sm">Details</h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">
                  {material.fileType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <Badge className="text-xs" variant="secondary">
                  {material.visibility}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  className="text-xs"
                  variant={
                    material.status === "ready" ? "default" : "secondary"
                  }
                >
                  {material.status}
                </Badge>
              </div>
              {material.durationSeconds && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {Math.floor(material.durationSeconds / 60)}:
                    {(material.durationSeconds % 60)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                </div>
              )}
              {material.size && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">
                    {(material.size / 1_048_576).toFixed(1)} MB
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[2rem] border-border/95 bg-card/82 shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_10%,transparent)] backdrop-blur-md">
            <CardHeader className="pb-3">
              <h3 className="font-medium text-sm">Content Notes</h3>
            </CardHeader>
            <CardContent>
              {material.content ? (
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                  {material.content}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No additional notes added.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditMaterialDialog
        material={{
          id: material.id,
          title: material.title,
          description: material.description,
          content: material.content,
          tags: Array.isArray(material.tags)
            ? (material.tags as string[])
            : null,
          visibility: material.visibility,
          channelId: material.channelId,
        }}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      </div>
    </div>
  );
}
