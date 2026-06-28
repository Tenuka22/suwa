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

  const handleSave = useCallback(async () => {
    if (!(material && title.trim())) {
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
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-medium text-sm">
            Edit details
          </DialogTitle>
          <DialogDescription>
            Update the title, description, tags, and visibility for this
            content.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex gap-1 border-b">
          {(["details", "transcription", "tags"] as EditTab[]).map((tab) => (
            <button
              className={`rounded-md px-3 py-1.5 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === "details" && "Details"}
              {tab === "transcription" && "Transcription / Notes"}
              {tab === "tags" && `Tags (${tags.length})`}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                value={title}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
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
                  onValueChange={(v) => setChannelId(v ?? "")}
                  value={channelId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
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
                    className={`px-3 py-1 flex items-center gap-3 rounded-lg border text-left transition-colors ${
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

        {/* Transcription / Notes Tab */}
        {activeTab === "transcription" && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-content">
                Transcription / Session Notes
              </Label>
              <p className="text-muted-foreground text-xs">
                Add a transcription, session notes, or any additional context
                about this content. This will be visible on the detail page.
              </p>
              <Textarea
                className="min-h-[200px] font-mono text-sm"
                id="edit-content"
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste the transcription, session notes, or summary here..."
                rows={10}
                value={content}
              />
            </div>
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === "tags" && (
          <div className="grid gap-4">
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
                  disabled={!tagInput.trim() || tags.length >= 20}
                  onClick={handleAddTag}
                  size="icon"
                  type="button"
                  variant="outline"
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
                    <Badge className="gap-1" key={tag} variant="secondary">
                      {tag}
                      <button
                        className="rounded-full transition-colors hover:bg-muted-foreground/20"
                        onClick={() => handleRemoveTag(tag)}
                        type="button"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-lg border border-border/60 border-dashed text-center">
                <p className="text-muted-foreground text-sm">
                  No tags added yet.
                </p>
                <p className="text-muted-foreground text-xs">
                  Tags help others discover your content.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={!title.trim() || isSaving}
            onClick={handleSave}
          >
            {isSaving && <Loader2Icon className="size-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
