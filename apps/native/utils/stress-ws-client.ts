"use client";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { WsAppRouterClient } from "@suwa/api/routers/index";
import { env } from "@suwa/env/native";
import { Platform } from "react-native";
import { authClient } from "@/utils/better-auth";

const baseUrl = env.EXPO_PUBLIC_SERVER_URL.replace(/\/$/, "");
const wsUrl = baseUrl.startsWith("https://") 
  ? baseUrl.replace("https://", "wss://") 
  : baseUrl.replace("http://", "ws://");

console.log(`[WS] Connecting to: ${wsUrl}/api/ws`);

function buildWsUrl(): string {
  let url = `${wsUrl}/api/ws`;

  // Try extracting the cookie from better-auth client
  let token = authClient.getCookie();
  
  if (!token) {
    // If not found, look up internal session data
    const sessionStore = (authClient as any).store?.getState?.();
    if (sessionStore?.session?.token) {
      token = sessionStore.session.token;
    }
  }

  // Local storage keys based on better-auth custom prefixes
  if (!token && Platform.OS === "web") {
    // Expo Client custom prefix often uses the app scheme (usually 'suwa' or 'doca')
    const prefix = "suwa_"; // based on project/app name
    const keys = [
      "better-auth.session-token",
      `${prefix}better-auth.session-token`,
      "better-auth.token",
      `${prefix}better-auth.token`,
    ];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        token = val;
        break;
      }
    }
    
    // Fallback: search all localStorage keys containing 'token' or 'session'
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("token") || key.includes("session"))) {
          const val = localStorage.getItem(key);
          if (val && val.length > 20) { // token is long
            token = val;
            break;
          }
        }
      }
    }
  }

  if (token) {
    url += `?cookie=${encodeURIComponent(token)}`;
  }

  return url;
}

class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly messageQueue: Array<(ws: WebSocket) => void> = [];
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private closeHandler: (() => void) | null = null;
  private destroyed = false;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    if (this.destroyed) return;

    this.ws = new WebSocket(this.url);

    this.ws.addEventListener("open", () => {
      const queue = this.messageQueue.splice(0);
      for (const cb of queue) {
        try { cb(this.ws!); } catch { /* skip */ }
      }
    });

    this.ws.addEventListener("message", (event) => {
      this.messageHandler?.(event);
    });

    this.ws.addEventListener("close", () => {
      this.ws = null;
      this.closeHandler?.();
      if (!this.destroyed) {
        setTimeout(() => this.connect(), 1000);
      }
    });

    this.ws.addEventListener("error", () => {
      // onerror fires before onclose; close handler triggers reconnect
    });
  }

  send(data: string | ArrayBuffer | SharedArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.messageQueue.push((ws) => { ws.send(data); });
    }
  }

  addEventListener(event: "message" | "close", handler: (event: any) => void) {
    if (event === "message") {
      this.messageHandler = handler;
    } else if (event === "close") {
      this.closeHandler = handler;
    }
  }

  removeEventListener(event: "message" | "close", _handler: (event: any) => void) {
    if (event === "message") {
      this.messageHandler = null;
    } else if (event === "close") {
      this.closeHandler = null;
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CONNECTING;
  }

  destroy() {
    this.destroyed = true;
    this.ws?.close();
    this.ws = null;
  }
}

const wsLink = new RPCLink({
  websocket: new ReconnectingWebSocket(buildWsUrl()) as unknown as WebSocket,
});

export const stressWsClient: WsAppRouterClient = createORPCClient(wsLink);
