import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@zen-doc/ui/components/avatar";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Input } from "@zen-doc/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zen-doc/ui/components/select";
import { Skeleton } from "@zen-doc/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@zen-doc/ui/components/tabs";
import {
  FilmIcon,
  FilterIcon,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  RadioIcon,
  SearchIcon,
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
} from "@/hooks/hub/use-hub";
import { orpc } from "@/utils/orpc";

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
  const { user } = useUser();
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
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: materials, isLoading: materialsLoading } = useHubMaterials({
    channelId: selectedChannel === "all" ? undefined : selectedChannel,
    status:
      activeTab === "uploading"
        ? "uploading"
        : activeTab === "all"
          ? undefined
          : undefined,
  });

  const { data: channels } = useHubChannels();
  const deleteMaterial = useDeleteMaterial();

  const allMaterials = materials ?? initialMaterials ?? [];
  const allChannels = channels ?? initialChannels ?? [];

  // Filter materials by tab
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

  // Sort
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

  const name = user?.fullName ?? user?.username ?? "Doctor";
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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Channel Header Banner */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-background md:h-52">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.15),transparent_50%)]" />
      </div>

      {/* Channel Info */}
      <div className="relative z-10 -mt-12 px-6">
        <div className="flex items-end gap-5">
          <Avatar className="size-24 border-4 border-background shadow-xl">
            <AvatarImage src={user?.imageUrl} />
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
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
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
                <>
                  <span>&middot;</span>
                  <Badge className="gap-1" variant="outline">
                    <UploadIcon className="size-3" />
                    {totalUploading} uploading
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Button
              className="gap-2 rounded-full"
              onClick={() => setCreateChannelOpen(true)}
              variant="outline"
            >
              <PlusIcon className="size-4" />
              Channel
            </Button>
            <Button
              className="gap-2 rounded-full"
              onClick={() => setUploadOpen(true)}
            >
              <UploadIcon className="size-4" />
              Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Channel Tabs (YouTube-style horizontal scroll) */}
      {allChannels.length > 0 && (
        <div className="px-6">
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              className="shrink-0 rounded-full"
              onClick={() => setSelectedChannel("all")}
              size="sm"
              variant={selectedChannel === "all" ? "default" : "ghost"}
            >
              All channels
            </Button>
            {allChannels.map((ch) => (
              <Button
                className="shrink-0 gap-2 rounded-full"
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                size="sm"
                variant={selectedChannel === ch.id ? "default" : "ghost"}
              >
                <RadioIcon className="size-3" />
                {ch.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 px-6 flex gap-4 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex max-w-md flex-1 items-center gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-full border-none bg-muted/30 pl-10 focus-visible:ring-1 focus-visible:ring-primary/50"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your materials..."
                value={searchQuery}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              onValueChange={(v) => setActiveTab(v as FilterTab)}
              value={activeTab}
            >
              <TabsList className="h-auto gap-1 border-none bg-transparent p-0">
                <TabsTrigger
                  className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                  value="all"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                  value="videos"
                >
                  Videos
                </TabsTrigger>
                <TabsTrigger
                  className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                  value="audio"
                >
                  Audio
                </TabsTrigger>
                {totalUploading > 0 && (
                  <TabsTrigger
                    className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                    value="uploading"
                  >
                    <UploadIcon className="mr-1 size-3" />
                    Uploading
                    <Badge className="ml-1.5 px-1.5" variant="secondary">
                      {totalUploading}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <div className="mx-1 h-6 w-px bg-border/60" />

            <Select
              onValueChange={(v) => setSortBy(v as SortOption)}
              value={sortBy}
            >
              <SelectTrigger className="h-9 w-[140px] rounded-full border-border/60 text-sm">
                <FilterIcon className="mr-1 size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">By title</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-0.5">
              <Button
                className="size-9 rounded-full"
                onClick={() => setViewMode("grid")}
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
              >
                <LayoutGridIcon className="size-4" />
              </Button>
              <Button
                className="size-9 rounded-full"
                onClick={() => setViewMode("list")}
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
              >
                <ListIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
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
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="rounded-full bg-muted/40">
              {activeTab === "uploading" ? (
                <UploadIcon className="size-8 text-muted-foreground" />
              ) : activeTab === "audio" ? (
                <RadioIcon className="size-8 text-muted-foreground" />
              ) : (
                <FilmIcon className="size-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium text-sm">
              {activeTab === "uploading"
                ? "No uploads in progress"
                : searchQuery
                  ? "No results found"
                  : "No content yet"}
            </h3>
            <p className="max-w-sm text-muted-foreground text-sm">
              {searchQuery
                ? "Try a different search term or clear your filters."
                : "Upload your first video or audio to share with patients and build your channel."}
            </p>
            {!searchQuery && activeTab !== "uploading" && (
              <Button
                className="gap-2 rounded-full"
                onClick={() => setUploadOpen(true)}
              >
                <UploadIcon className="size-4" />
                Upload content
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedMaterials.map((material) => (
              <HubMaterialCard
                createdAt={material.createdAt}
                durationSeconds={material.durationSeconds}
                fileType={material.fileType}
                id={material.id}
                key={material.id}
                onDelete={(id) => deleteMaterial.mutate({ id })}
                onEdit={(id) => {
                  const m = allMaterials.find((mat) => mat.id === id);
                  if (m) {
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
                  }
                }}
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
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedMaterials.map((material) => (
              <div
                className="flex items-center gap-4 rounded-xl transition-colors hover:bg-muted/30"
                key={material.id}
              >
                <div className="relative flex aspect-video w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                  {material.fileType === "video" ? (
                    <FilmIcon className="size-6 text-muted-foreground/40" />
                  ) : (
                    <RadioIcon className="size-6 text-muted-foreground/40" />
                  )}
                  {material.durationSeconds && (
                    <Badge
                      className="absolute right-1 bottom-1 border-none bg-black/80 px-1 py-0 text-[10px] text-white"
                      variant="outline"
                    >
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
                  <div className="flex items-center gap-2">
                    <Badge
                      className="px-1.5 py-0 text-[10px]"
                      variant="secondary"
                    >
                      {material.visibility}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => {
                      setEditMaterial({
                        id: material.id,
                        title: material.title,
                        description: material.description,
                        content: material.content,
                        tags: Array.isArray(material.tags)
                          ? (material.tags as string[])
                          : null,
                        visibility: material.visibility,
                        channelId: material.channelId,
                      });
                      setEditOpen(true);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    className="shrink-0"
                    onClick={() => deleteMaterial.mutate({ id: material.id })}
                    size="icon"
                    variant="ghost"
                  >
                    <PlusIcon className="size-4 rotate-45" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
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
    </div>
  );
}
