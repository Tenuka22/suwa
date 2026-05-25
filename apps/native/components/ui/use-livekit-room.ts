import {
  type Room,
  type RoomEvent,
  RoomEvent as RoomEvents,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [participants, setParticipants] = useState<string[]>([]);

  const connect = useCallback(
    async (url: string, token: string) => {
      setIsConnecting(true);
      setError(null);

      try {
        const { Room: RoomClass } = await import("livekit-client");
        const room = new RoomClass({
          adaptiveStream: true,
          dynacast: true,
        });

        room.on(RoomEvents.Connected satisfies RoomEvent, () => {
          setIsConnected(true);
          setIsConnecting(false);
          options.onConnected?.();
        });

        room.on(RoomEvents.Disconnected satisfies RoomEvent, () => {
          setIsConnected(false);
          setIsConnecting(false);
          options.onDisconnected?.();
        });

        room.on(
          RoomEvents.ParticipantConnected satisfies RoomEvent,
          (participant: { identity: string }) => {
            setParticipants((prev) => [...prev, participant.identity]);
          }
        );

        room.on(
          RoomEvents.ParticipantDisconnected satisfies RoomEvent,
          (participant: { identity: string }) => {
            setParticipants((prev) =>
              prev.filter((p) => p !== participant.identity)
            );
          }
        );

        room.on(RoomEvents.Disconnected satisfies RoomEvent, () => {
          setIsConnected(false);
          setParticipants([]);
        });

        await room.connect(url, token);
        roomRef.current = room;
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
    setParticipants([]);
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
    participants,
    room: roomRef.current,
  };
}
