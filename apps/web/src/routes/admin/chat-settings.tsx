import { Card, Label, Switch } from "@heroui/react";
import { chatSystemRegistry } from "@suwa/api/routers/chat/helpers/chat-systems";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/admin/chat-settings")({
  component: ChatSettingsPage,
});

function ChatSettingsPage() {
  const [systems, setSystems] = React.useState(chatSystemRegistry.getActive());

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl">Chat System Settings</h1>
          <p className="text-muted-foreground">Manage available chat systems</p>
        </div>

        <div className="grid gap-4">
          {systems.map((system) => (
            <Card key={system.id}>
              <Card.Header>
                <Card.Title className="flex items-center justify-between">
                  {system.name}
                  <Switch defaultSelected={system.enabled} />
                </Card.Title>
                <Card.Description>{system.description}</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium text-sm">ID:</Label>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {system.id}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="font-medium text-sm">Status:</Label>
                    <span
                      className={`font-medium text-sm ${
                        system.enabled ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {system.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
