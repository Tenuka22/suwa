import { chatSystemRegistry } from "@suwa/api/routers/chat/helpers/chat-systems";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Label } from "@suwa/ui/components/label";
import { Switch } from "@suwa/ui/components/switch";
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
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {system.name}
                  <Switch defaultChecked={system.enabled} />
                </CardTitle>
                <CardDescription>{system.description}</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
