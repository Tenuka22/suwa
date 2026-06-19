import {
  Button,
  Chip,
  cn,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Tabs,
  TextArea,
} from "@heroui/react";
import {
  EyeIcon,
  EyeOffIcon,
  LinkIcon,
  Loader2Icon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useHubChannels, useUpdateMaterial } from "@/hooks/hub/use-hub";

interface EditMaterialDialogProps {
  material: {
    id: string;
    title: string;
    description?: string | null;
    content?: string | null;
    tags?: string[] | null;
    visibility: "public" | "unlisted" | "private";
    channelId?: string | null;
  } | null;
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

type EditTab = "details" | "transcription" | "tags";

export function EditMaterialDialog({
  open,
  onOpenChange,
  material,
}: EditMaterialDialogProps) {
  const [activeTab, setActiveTab] = useState<EditTab>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<
    "public" | "unlisted" | "private"
  >("private");
  const [channelId, setChannelId] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const { data: channels } = useHubChannels();
  const updateMaterial = useUpdateMaterial();

  // Populate fields when material changes
  useEffect(() => {
    if (material) {
      setTitle(material.title ?? "");
      setDescription(material.description ?? "");
      setContent(material.content ?? "");
      setVisibility(material.visibility ?? "private");
      setChannelId(material.channelId ?? "");
      setTags(Array.isArray(material.tags) ? [...material.tags] : []);
      setTagInput("");
      setActiveTab("details");
    }
  }, [material]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const hasDetailsErrors = showErrors && !title.trim();

  const handleSave = useCallback(async () => {
    if (!material) {
      return;
    }

    setShowErrors(true);

    if (!title.trim()) {
      return;
    }

    await updateMaterial.mutateAsync({
      id: material.id,
      title: title.trim(),
      description: description.trim() || null,
      content: content.trim() || null,
      visibility,
      channelId: channelId || null,
      tags: tags.length > 0 ? tags : null,
    });

    onOpenChange(false);
  }, [
    material,
    title,
    description,
    content,
    visibility,
    channelId,
    tags,
    updateMaterial,
    onOpenChange,
  ]);

  const isSaving = updateMaterial.isPending;

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="max-h-[85vh] overflow-y-auto bg-background">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading className="font-medium text-sm">
              Edit details
            </Modal.Heading>
            <p className="text-muted-foreground text-sm">
              Update the title, description, tags, and visibility for this
              content.
            </p>
          </Modal.Header>
          <Modal.Body>
            <Tabs
              onSelectionChange={(key) => setActiveTab(key as EditTab)}
              selectedKey={activeTab}
            >
              <Tabs.ListContainer>
                <Tabs.List>
                  <Tabs.Tab
                    className={cn(
                      hasDetailsErrors &&
                        "data-[selected=false]:ring-2 data-[selected=false]:ring-red-500/70"
                    )}
                    id="details"
                  >
                    Details
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="transcription">
                    Transcription
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="tags">
                    Tags ({tags.length})
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel className="grid gap-4 pt-4" id="details">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className={cn(
                      hasDetailsErrors &&
                        "border-destructive/70 ring-destructive/30"
                    )}
                    id="edit-title"
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title"
                    value={title}
                  />
                  {hasDetailsErrors && (
                    <p className="text-destructive text-xs">
                      Title is required
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">
                    Description{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <TextArea
                    id="edit-description"
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about this content..."
                    rows={4}
                    value={description}
                  />
                </div>

                {channels && channels.length > 0 ? (
                  <div className="grid gap-2">
                    <Label>Channel</Label>
                    <Select
                      onSelectionChange={(key) =>
                        setChannelId((key ?? "") as string)
                      }
                      selectedKey={channelId}
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {channels.map((ch) => (
                            <ListBox.Item
                              id={ch.id}
                              key={ch.id}
                              textValue={ch.name}
                            >
                              {ch.name}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
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
              </Tabs.Panel>

              <Tabs.Panel className="grid gap-4 pt-4" id="transcription">
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">
                    Transcription / Session Notes
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Add a transcription, session notes, or any additional
                    context about this content. This will be visible on the
                    detail page.
                  </p>
                  <TextArea
                    className="min-h-[200px] font-mono text-sm"
                    id="edit-content"
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type or paste the transcription, session notes, or summary here..."
                    rows={10}
                    value={content}
                  />
                </div>
              </Tabs.Panel>

              <Tabs.Panel className="grid gap-4 pt-4" id="tags">
                <div className="grid gap-2">
                  <Label htmlFor="edit-tag-input">
                    Add tags{" "}
                    <span className="text-muted-foreground">
                      (up to 20, press Enter or comma to add)
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      disabled={tags.length >= 20}
                      id="edit-tag-input"
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={
                        tags.length >= 20
                          ? "Maximum tags reached"
                          : "Type a tag and press Enter..."
                      }
                      value={tagInput}
                    />
                    <Button
                      isDisabled={!tagInput.trim() || tags.length >= 20}
                      onPress={handleAddTag}
                      size="sm"
                      className="size-9"
                      variant="secondary"
                    >
                      <PlusIcon className="size-4" />
                    </Button>
                  </div>
                </div>

                {tags.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="font-medium text-sm">
                      {tags.length} tag{tags.length === 1 ? "" : "s"} added
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Chip
                          className="gap-1"
                          color="default"
                          key={tag}
                          variant="soft"
                        >
                          {tag}
                          <button
                            className="rounded-full transition-colors hover:bg-muted-foreground/20"
                            onClick={() => handleRemoveTag(tag)}
                            type="button"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </Chip>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 border-dashed py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No tags added yet.
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Tags help others discover your content.
                    </p>
                  </div>
                )}
              </Tabs.Panel>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button
              className="gap-2"
              isDisabled={!title.trim() || isSaving}
              onPress={handleSave}
            >
              {isSaving && <Loader2Icon className="size-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
