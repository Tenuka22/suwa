'use client';

import { type Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatParticipantLabel } from "@/utils/format-participant";

interface RemoteParticipantInfo {
  displayName: string;
  identity: string;
  isAnonymous: boolean;
  streamURL: string;
}

interface UseLiveKitRoomOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function useLiveKitRoom(options: UseLiveKitRoomOptions = {}) {
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipantInfo[]
  >([]);
  const [localStreamURL, setLocalStreamURL] = useState<string | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);

  const connect = useCallback(
    async (url: string, token: string) => {
      setIsConnecting(true);
      setError(null);

      try {
        const { Room: RoomClass } = await import("livekit-client");
        const room = new RoomClass({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { height: 720, width: 1280 },
          },
        });

        room.on(RoomEvent.Connected, () => {
          setIsConnected(true);
          setIsConnecting(false);
          setRoom(room);
          roomRef.current = room;
          options.onConnected?.();

          // Sync initial participants
          const participants: RemoteParticipantInfo[] = [];
          for (const [, p] of room.remoteParticipants) {
            participants.push({
              identity: p.identity,
              streamURL: "", // Browser tracks are handled via track.attach
              isAnonymous: false,
              displayName: formatParticipantLabel(p.identity),
            });
          }
          setRemoteParticipants(participants);
        });

        room.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setIsConnecting(false);
          setRemoteParticipants([]);
          setRoom(null);
          options.onDisconnected?.();
        });

        room.on(RoomEvent.ParticipantConnected, (p) => {
          setRemoteParticipants((prev) => [
            ...prev,
            {
              identity: p.identity,
              streamURL: "",
              isAnonymous: false,
              displayName: formatParticipantLabel(p.identity),
            },
          ]);
        });

        room.on(RoomEvent.ParticipantDisconnected, (p) => {
          setRemoteParticipants((prev) =>
            prev.filter((item) => item.identity !== p.identity)
          );
        });

        await room.connect(url, token);
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to connect";
        setError(message);
        setIsConnecting(false);
        options.onError?.(err instanceof Error ? err : new Error(message));
      }
    },
    [options]
  );

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      room.removeAllListeners();
      await room.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setRemoteParticipants([]);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      const enabled = !room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(enabled);
      setIsCameraEnabled(enabled);
    }
  }, []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      const enabled = !room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(enabled);
      setIsMicEnabled(enabled);
    }
  }, []);

  useEffect(
    () => () => {
      const room = roomRef.current;
      if (room) {
        room.removeAllListeners();
        room.disconnect().catch(() => undefined);
      }
    },
    []
  );

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    remoteParticipants,
    localStreamURL,
    isCameraEnabled,
    isMicEnabled,
    toggleCamera,
    toggleMic,
    room,
  };
}
