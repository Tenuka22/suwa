import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@suwa/ui/components/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@suwa/ui/components/alert-dialog";
import { Badge } from "@suwa/ui/components/badge";
import { Button } from "@suwa/ui/components/button";
import { Card } from "@suwa/ui/components/card";
import { Input } from "@suwa/ui/components/input";
import { ScrollArea, ScrollBar } from "@suwa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@suwa/ui/components/select";
import { Separator } from "@suwa/ui/components/separator";
import { Skeleton } from "@suwa/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@suwa/ui/components/tabs";
import { ToggleGroup, ToggleGroupItem } from "@suwa/ui/components/toggle-group";
import { createFileRoute } from "@tanstack/react-router";
import {
  FilmIcon,
  FilterIcon,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  RadioIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useState } from "react";

import {
  CreateChannelDialog,
  EditMaterialDialog,
  HubMaterialCard,
  UploadWizardDialog,
} from "@/components/hub";
import {
  useDeleteMaterial,
  useHubChannels,
  useHubMaterials,
  useUpdateMaterial,
} from "@/hooks/hub/use-hub";
import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/utils/orpc";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/hub")({
  loader: async ({ context }) => {
    const [materials, channels] = await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.listMaterials.queryOptions({ input: { page: 1, pageSize: 50 } })
      ),
      context.queryClient.ensureQueryData(
        orpc.listHubChannels.queryOptions({ input: { page: 1, pageSize: 100 } })
      ),
    ]);
    return { materials, channels };
  },
  component: DoctorHubPage,
});

type FilterTab = "all" | "videos" | "audio" | "uploading";
type SortOption = "newest" | "oldest" | "title";

function DoctorHubPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const { materials: initialMaterials, channels: initialChannels } =
    Route.useLoaderData();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<{
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    tags?: string[] | null;
    visibility: "public" | "unlisted" | "private";
    channelId?: string | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: materials, isLoading: materialsLoading } = useHubMaterials({
    channelId: selectedChannel === "all" ? undefined : selectedChannel,
  });

  const { data: channels } = useHubChannels();
  const deleteMaterial = useDeleteMaterial();
  const updateMaterial = useUpdateMaterial();

  const allMaterials = materials ?? initialMaterials ?? [];
  const allChannels = channels ?? initialChannels ?? [];

  const filteredMaterials = allMaterials.filter((m) => {
    if (activeTab === "videos" && m.fileType !== "video") {
      return false;
    }
    if (activeTab === "audio" && m.fileType !== "audio") {
      return false;
    }
    if (
      activeTab === "uploading" &&
      m.status !== "uploading" &&
      m.status !== "processing"
    ) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(query) ||
        (m.description?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const name = user?.name ?? "Doctor";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const totalVideos = allMaterials.filter(
    (m) => m.fileType === "video" && m.status === "ready"
  ).length;
  const totalAudio = allMaterials.filter(
    (m) => m.fileType === "audio" && m.status === "ready"
  ).length;
  const totalUploading = allMaterials.filter(
    (m) => m.status === "uploading" || m.status === "processing"
  ).length;

  const openEditDialog = (id: string) => {
    const m = allMaterials.find((mat) => mat.id === id);
    if (!m) return;
    setEditMaterial({
      id: m.id,
      title: m.title,
      description: m.description,
      content: m.content,
      tags: Array.isArray(m.tags) ? (m.tags as string[]) : null,
      visibility: m.visibility,
      channelId: m.channelId,
    });
    setEditOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMaterial.mutate({ id: deleteTarget.id });
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <div className="flex flex-wrap items-end gap-5">
          <Avatar className="size-24 border-4 border-background shadow-lg">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-lg tracking-tight">{name}</h1>
              <Badge className="gap-1" variant="default">
                <FilmIcon className="size-3" />
                Doctor Hub
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              <span>
                {allChannels.length}{" "}
                {allChannels.length === 1 ? "channel" : "channels"}
              </span>
              <span>&middot;</span>
              <span>
                {totalVideos} {totalVideos === 1 ? "video" : "videos"}
              </span>
              <span>&middot;</span>
              <span>
                {totalAudio} {totalAudio === 1 ? "audio" : "audio files"}
              </span>
              {totalUploading > 0 && (
                <Badge className="gap-1" variant="outline">
                  <UploadIcon className="size-3" />
                  {totalUploading} uploading
                </Badge>
              )}
            </div>
          </div>

            <div className="flex items-center gap-2 pb-2">
              <Button asChild variant="outline">
                <Link to="/doctor/payments">Payments</Link>
              </Button>
              <Button onClick={() => setCreateChannelOpen(true)} variant="outline">
                <PlusIcon className="size-4" />
                Channel
              </Button>
              <Button onClick={() => setUploadOpen(true)}>
                <UploadIcon className="size-4" />
                Upload
              </Button>
            </div>
        </div>
      </div>

      {allChannels.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <ToggleGroup
            className="justify-start gap-2 pb-2"
            onValueChange={(v) => v && setSelectedChannel(v)}
            type="single"
            value={selectedChannel}
            variant="outline"
          >
            <ToggleGroupItem className="rounded-full px-4" value="all">
              All channels
            </ToggleGroupItem>
            {allChannels.map((ch) => (
              <ToggleGroupItem
                className="gap-1.5 rounded-full px-4"
                key={ch.id}
                value={ch.id}
              >
                <RadioIcon className="size-3" />
                {ch.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your materials..."
              value={searchQuery}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              onValueChange={(v) => setActiveTab(v as FilterTab)}
              value={activeTab}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                {totalUploading > 0 && (
                  <TabsTrigger value="uploading">
                    <UploadIcon className="size-3" />
                    Uploading
                    <Badge className="px-1.5" variant="secondary">
                      {totalUploading}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <Separator className="h-6" orientation="vertical" />

            <Select
              onValueChange={(v) => setSortBy(v as SortOption)}
              value={sortBy}
            >
              <SelectTrigger className="w-[150px]">
                <FilterIcon className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">By title</SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup
              onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
              type="single"
              value={viewMode}
              variant="outline"
            >
              <ToggleGroupItem aria-label="Grid view" value="grid">
                <LayoutGridIcon className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="List view" value="list">
                <ListIcon className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {materialsLoading ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="flex flex-col gap-3" key={i.toString()}>
                <Skeleton className="aspect-video rounded-xl" />
                <div className="flex gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedMaterials.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-4 border-dashed py-24 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              {activeTab === "uploading" ? (
                <UploadIcon className="size-6 text-muted-foreground" />
              ) : activeTab === "audio" ? (
                <RadioIcon className="size-6 text-muted-foreground" />
              ) : (
                <FilmIcon className="size-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {activeTab === "uploading"
                  ? "No uploads in progress"
                  : searchQuery
                    ? "No results found"
                    : "No content yet"}
              </h3>
              <p className="mx-auto max-w-sm text-muted-foreground text-sm">
                {searchQuery
                  ? "Try a different search term or clear your filters."
                  : "Upload your first video or audio to share with patients and build your channel."}
              </p>
            </div>
            {!searchQuery && activeTab !== "uploading" && (
              <Button onClick={() => setUploadOpen(true)}>
                <UploadIcon className="size-4" />
                Upload content
              </Button>
            )}
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedMaterials.map((material) => (
              <Link key={material.id} params={{ materialId: material.id }} to="/doctor/hub/$materialId">
                <HubMaterialCard
                  createdAt={material.createdAt}
                  durationSeconds={material.durationSeconds}
                  fileType={material.fileType}
                  id={material.id}
                  onDelete={() =>
                    setDeleteTarget({ id: material.id, title: material.title })
                  }
                  onEdit={openEditDialog}
                  onVisibilityChange={(id, visibility) =>
                    updateMaterial.mutate({ id, visibility })
                  }
                  size={material.size}
                  status={material.status}
                  tags={
                    Array.isArray(material.tags)
                      ? (material.tags as string[])
                      : null
                  }
                  title={material.title}
                  visibility={material.visibility}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedMaterials.map((material) => (
              <Link key={material.id} params={{ materialId: material.id }} to="/doctor/hub/$materialId">
                <Card className="flex flex-row items-center gap-4 p-3 transition-shadow hover:shadow-md">
                  <div className="relative flex aspect-video w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
                    {material.fileType === "video" ? (
                      <FilmIcon className="size-6 text-muted-foreground/50" />
                    ) : (
                      <RadioIcon className="size-6 text-muted-foreground/50" />
                    )}
                    {material.durationSeconds && (
                      <Badge className="absolute right-1 bottom-1 px-1 py-0 text-[10px]">
                        {Math.floor(material.durationSeconds / 60)}:
                        {(material.durationSeconds % 60)
                          .toString()
                          .padStart(2, "0")}
                      </Badge>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-sm">
                      {material.title}
                    </h3>
                    <p className="truncate text-muted-foreground text-xs">
                      {material.description ?? "No description"}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge className="px-1.5 py-0 text-[10px]" variant="secondary">
                        {material.visibility}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(material.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Button
                      onClick={() => openEditDialog(material.id)}
                      size="icon"
                      variant="ghost"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      onClick={() =>
                        setDeleteTarget({ id: material.id, title: material.title })
                      }
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <EditMaterialDialog
        material={editMaterial}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <UploadWizardDialog onOpenChange={setUploadOpen} open={uploadOpen} />
      <CreateChannelDialog
        onOpenChange={setCreateChannelOpen}
        open={createChannelOpen}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        open={deleteTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file from your hub and from any channel it's
              published to. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
