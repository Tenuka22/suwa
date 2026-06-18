import { useUser } from "@clerk/tanstack-react-start";
import { Avatar, Button, Card, Chip, Dropdown, Separator } from "@heroui/react";
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
  const { user } = useUser();
  const [editOpen, setEditOpen] = useState(false);

  const name = user?.fullName ?? user?.username ?? "Doctor";
  const timeAgo = formatDistanceToNow(new Date(material.createdAt), {
    addSuffix: true,
  });

  const isVideo = material.fileType === "video";

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
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
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-border/40 bg-black/5">
            {isVideo ? (
              <FilmIcon className="size-16 text-muted-foreground/30" />
            ) : (
              <RadioIcon className="size-16 text-muted-foreground/30" />
            )}
            {material.status !== "ready" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Chip
                  className="px-4 py-1 text-sm"
                  color={material.status === "failed" ? "danger" : "default"}
                  variant="soft"
                >
                  {material.status === "uploading" && "Still uploading..."}
                  {material.status === "processing" && "Processing..."}
                  {material.status === "failed" && "Upload failed"}
                </Chip>
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
                  <Chip
                    className="gap-1"
                    color={
                      material.visibility === "public" ? "accent" : "default"
                    }
                    variant="soft"
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
                  </Chip>
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
                  className="gap-2 rounded-full"
                  size="sm"
                  variant="outline"
                >
                  <ShareIcon className="size-4" />
                  Share
                </Button>
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button isIconOnly variant="ghost">
                      <EllipsisIcon className="size-4" />
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Popover placement="end">
                    <Dropdown.Menu>
                      <Dropdown.Item onPress={() => setEditOpen(true)}>
                        <PencilIcon className="mr-2 size-4" />
                        Edit details
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <EyeIcon className="mr-2 size-4" />
                        Change visibility
                      </Dropdown.Item>
                      <Separator className="my-1" />
                      <Dropdown.Item className="text-destructive focus:text-destructive">
                        <Trash2Icon className="mr-2 size-4" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            </div>
          </div>

          <Separator />

          {/* Channel Info */}
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <Avatar.Image src={user?.imageUrl} />
              <Avatar.Fallback className="font-semibold text-sm">
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </Avatar.Fallback>
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
            <Card className="rounded-xl">
              <Card.Content>
                <p className="whitespace-pre-wrap text-sm">
                  {material.description}
                </p>
              </Card.Content>
            </Card>
          )}

          {/* Tags */}
          {material.tags &&
            Array.isArray(material.tags) &&
            material.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(material.tags as string[]).map((tag: string) => (
                  <Chip color="default" key={tag} variant="soft">
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
        </div>

        {/* Sidebar - Related/Playlists */}
        <div className="flex flex-col gap-4">
          <Card className="rounded-xl">
            <Card.Header className="pb-3">
              <h3 className="font-medium text-sm">Details</h3>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">
                  {material.fileType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visibility</span>
                <Chip className="text-xs" color="default" variant="soft">
                  {material.visibility}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Chip
                  className="text-xs"
                  color={material.status === "ready" ? "accent" : "default"}
                  variant="soft"
                >
                  {material.status}
                </Chip>
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
            </Card.Content>
          </Card>

          <Card className="rounded-xl">
            <Card.Header className="pb-3">
              <h3 className="font-medium text-sm">Content Notes</h3>
            </Card.Header>
            <Card.Content>
              {material.content ? (
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">
                  {material.content}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No additional notes added.
                </p>
              )}
            </Card.Content>
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
  );
}
