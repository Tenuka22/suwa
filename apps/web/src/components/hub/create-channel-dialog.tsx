import { Button, cn, Input, Label, Modal, TextArea } from "@heroui/react";
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
  const [showErrors, setShowErrors] = useState(false);

  const hasNameError = showErrors && !name.trim();
  const hasHandleError = showErrors && !handle.trim();

  const handleSubmit = async () => {
    setShowErrors(true);

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
    <Modal.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[480px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading className="font-medium text-sm">
              Create a new channel
            </Modal.Heading>
            <p className="text-muted-foreground text-sm">
              Create a channel to organize and share your content. Like a
              YouTube channel, this is your public-facing identity for sharing
              sessions and videos.
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="channel-name">
                  Channel name <span className="text-destructive">*</span>
                </Label>
                <Input
                  className={cn(hasNameError && "border-destructive/70 ring-destructive/30")}
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
                {hasNameError && (
                  <p className="text-destructive text-xs">Channel name is required</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="channel-handle">
                  Handle <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <AtSignIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className={cn("pl-9", hasHandleError && "border-destructive/70 ring-destructive/30")}
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
                {hasHandleError && (
                  <p className="text-destructive text-xs">Handle is required</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Lowercase letters, numbers, underscores, and hyphens only.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="channel-description">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <TextArea
                  id="channel-description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your channel..."
                  rows={3}
                  value={description}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button
              isDisabled={
                !(name.trim() && handle.trim()) || createChannel.isPending
              }
              onPress={handleSubmit}
            >
              {createChannel.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              Create channel
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
