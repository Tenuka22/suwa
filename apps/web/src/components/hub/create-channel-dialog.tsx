import { Button } from "@zen-doc/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@zen-doc/ui/components/dialog";
import { Input } from "@zen-doc/ui/components/input";
import { Label } from "@zen-doc/ui/components/label";
import { Textarea } from "@zen-doc/ui/components/textarea";
import { AtSignIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useCreateHubChannel } from "@/hooks/hub/use-hub";

interface CreateChannelDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
}: CreateChannelDialogProps) {
  const createChannel = useCreateHubChannel();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!(name.trim() && handle.trim())) {
      return;
    }

    await createChannel.mutateAsync({
      name: name.trim(),
      handle: handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, ""),
      description: description.trim() || undefined,
      isDefault: false,
    });

    setName("");
    setHandle("");
    setDescription("");
    onOpenChange(false);
  };

  const autoGenerateHandle = (channelName: string) => {
    const generated = channelName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);
    setHandle(generated);
    return generated;
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-medium text-sm">
            Create a new channel
          </DialogTitle>
          <DialogDescription>
            Create a channel to organize and share your content. Like a YouTube
            channel, this is your public-facing identity for sharing sessions
            and videos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="channel-name">Channel name</Label>
            <Input
              id="channel-name"
              onChange={(e) => {
                setName(e.target.value);
                if (!handle) {
                  autoGenerateHandle(e.target.value);
                }
              }}
              placeholder="e.g. Dr. Sarah's Therapy Sessions"
              value={name}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="channel-handle">Handle</Label>
            <div className="relative">
              <AtSignIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                id="channel-handle"
                onChange={(e) =>
                  setHandle(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                  )
                }
                placeholder="dr_sarah_therapy"
                value={handle}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Lowercase letters, numbers, underscores, and hyphens only.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="channel-description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="channel-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your channel..."
              rows={3}
              value={description}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={
              !(name.trim() && handle.trim()) || createChannel.isPending
            }
            onClick={handleSubmit}
            type="button"
          >
            {createChannel.isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Create channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
