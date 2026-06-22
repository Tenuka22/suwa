import {
  Button,
  Chip,
  Input,
  ListBox,
  Select,
  Separator,
  Skeleton,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
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
  UploadIcon,
} from "lucide-react";
import { useState } from "react";
import {
  CreateChannelDialog,
  EditMaterialDialog,
  HubMaterialCard,
  UploadWizardDialog,
  WatchMaterialDialog,
} from "@/components/hub";
import { PageTitle } from "@/components/typography";
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
  const { materials: initialMaterials, channels: initialChannels } =
    Route.useLoaderData();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<{
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    tags?: string[] | null;
    visibility: "public" | "unlisted" | "private";
    channelId?: string | null;
  } | null>(null);
  const [watchMaterial, setWatchMaterial] = useState<{
    description?: string | null;
    fileType: "video" | "audio";
    id: string;
    tags?: string[] | null;
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

  const totalVideos = allMaterials.filter(
    (m) => m.fileType === "video" && m.status === "ready"
  ).length;
  const totalAudio = allMaterials.filter(
    (m) => m.fileType === "audio" && m.status === "ready"
  ).length;
  const totalUploading = allMaterials.filter(
    (m) => m.status === "uploading" || m.status === "processing"
  ).length;

  const handleWatch = (id: string) => {
    const m = allMaterials.find((mat) => mat.id === id);
    if (m && m.status === "ready") {
      setWatchMaterial({
        description: m.description,
        fileType: m.fileType,
        id: m.id,
        tags: Array.isArray(m.tags) ? (m.tags as string[]) : null,
        title: m.title,
      });
      setWatchOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>Content Hub</PageTitle>
            <p className="font-light text-md text-muted-foreground">
              Manage your video and audio content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="gap-2 rounded-full"
              onPress={() => setCreateChannelOpen(true)}
              size="sm"
              variant="outline"
            >
              <PlusIcon className="size-4" />
              Channel
            </Button>
            <Button
              className="gap-2 rounded-full"
              onPress={() => setUploadOpen(true)}
              size="sm"
            >
              <UploadIcon className="size-4" />
              Upload
            </Button>
          </div>
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
              <Chip className="gap-1">
                <UploadIcon className="size-3" />
                {totalUploading} uploading
              </Chip>
            </>
          )}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div>
          <PageTitle>Your materials</PageTitle>
          <p className="font-light text-md text-muted-foreground">
            Upload and manage your content
          </p>
        </div>

        {allChannels.length > 0 && (
          <ToggleButtonGroup
            className="flex flex-wrap"
            isDetached
            onSelectionChange={(keys) => {
              const key = [...keys][0] as string | undefined;
              if (key) {
                setSelectedChannel(key);
              }
            }}
            selectedKeys={[selectedChannel]}
            selectionMode="single"
          >
            <ToggleButton id="all">All channels</ToggleButton>
            {allChannels.map((channel) => (
              <ToggleButton id={channel.id} key={channel.id}>
                <RadioIcon className="mr-2 size-3" />
                {channel.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        <div className="flex flex-1 flex-row gap-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              onSelectionChange={(v) => setActiveTab(v as FilterTab)}
              selectedKey={activeTab}
            >
              <Tabs.List>
                <Tabs.Tab id="all">
                  All
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="videos">
                  Videos
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="audio">
                  Audio
                  <Tabs.Indicator />
                </Tabs.Tab>
                {totalUploading > 0 && (
                  <Tabs.Tab
                    className="rounded-full border border-border/60 px-4 py-1.5 text-sm data-[state=active]:bg-foreground data-[state=active]:text-background"
                    id="uploading"
                  >
                    <UploadIcon className="mr-1 size-3" />
                    Uploading
                    <Chip
                      className="ml-1.5 px-1.5"
                      color="default"
                      variant="soft"
                    >
                      {totalUploading}
                    </Chip>
                  </Tabs.Tab>
                )}
              </Tabs.List>
            </Tabs>

            <div className="mx-1 h-6 w-px bg-border/60" />
            <Select
              onSelectionChange={(id) => setSortBy(id as SortOption)}
              selectedKey={sortBy}
            >
              <Select.Trigger className="flex h-9 w-[140px] flex-row items-center justify-center gap-2 rounded-full border-border/60 text-sm">
                <FilterIcon className="mr-1 size-3.5" />
                <Select.Value />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="newest">Newest first</ListBox.Item>
                  <ListBox.Item id="oldest">Oldest first</ListBox.Item>
                  <ListBox.Item id="title">By title</ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="flex items-center gap-0.5">
              <Button
                className="size-9 rounded-full"
                isIconOnly
                onPress={() => setViewMode("grid")}
                variant={viewMode === "grid" ? "secondary" : "ghost"}
              >
                <LayoutGridIcon className="size-4" />
              </Button>
              <Button
                className="size-9 rounded-full"
                isIconOnly
                onPress={() => setViewMode("list")}
                variant={viewMode === "list" ? "secondary" : "ghost"}
              >
                <ListIcon className="size-4" />
              </Button>
            </div>
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
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div>
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
                onPress={() => setUploadOpen(true)}
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
                onWatch={handleWatch}
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
                    <Chip className="absolute right-1 bottom-1 border-none bg-black/80 px-1 py-0 text-[10px] text-white">
                      {Math.floor(material.durationSeconds / 60)}:
                      {(material.durationSeconds % 60)
                        .toString()
                        .padStart(2, "0")}
                    </Chip>
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
                    <Chip
                      className="px-1.5 py-0 text-[10px]"
                      color="default"
                      variant="soft"
                    >
                      {material.visibility}
                    </Chip>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {material.status === "ready" && (
                    <Button
                      isIconOnly
                      onPress={() => handleWatch(material.id)}
                      variant="ghost"
                    >
                      <FilmIcon className="size-4" />
                    </Button>
                  )}
                  <Button
                    isIconOnly
                    onPress={() => {
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
                    variant="ghost"
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    className="shrink-0"
                    isIconOnly
                    onPress={() => deleteMaterial.mutate({ id: material.id })}
                    variant="ghost"
                  >
                    <PlusIcon className="size-4 rotate-45" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
      <WatchMaterialDialog
        material={watchMaterial}
        onOpenChange={setWatchOpen}
        open={watchOpen}
      />
    </div>
  );
}
