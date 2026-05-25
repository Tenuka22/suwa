import {
  type Room,
  RoomEvent,
  type RoomEvent as RoomEventType,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseLiveKitRoomWebOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function useLiveKitRoomWeb(options: UseLiveKitRoomWebOptions = {}) {
  const roomRef = useRef<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const connect = useCallback(
    async (url: string, token: string) => {
      setIsConnecting(true);
      setError(null);

      try {
        const { Room } = await import(
          "livekit-client"
        );
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { height: 720, width: 1280 },
          },
          publishDefaults: {
            videoCodec: "vp8",
          },
        });

        room.on(RoomEvent.Connected satisfies RoomEventType, () => {
          setIsConnected(true);
          setIsConnecting(false);
          options.onConnected?.();
        });

        room.on(RoomEvent.Disconnected satisfies RoomEventType, () => {
          setIsConnected(false);
          setIsConnecting(false);
          options.onDisconnected?.();
        });

        room.on(RoomEvent.ParticipantConnected satisfies RoomEventType, () => {
          setParticipantCount((prev) => prev + 1);
        });

        room.on(
          RoomEvent.ParticipantDisconnected satisfies RoomEventType,
          () => {
            setParticipantCount((prev) => Math.max(0, prev - 1));
          }
        );

        room.on(
          RoomEvent.TrackSubscribed satisfies RoomEventType,
          (track, _publication, participant) => {
            if (
              track.kind === "video" &&
              videoRef.current &&
              !participant.isLocal
            ) {
              const mediaStream = new MediaStream();
              mediaStream.addTrack(track.mediaStreamTrack);
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => undefined);
            }
          }
        );

        room.on(
          RoomEvent.TrackUnsubscribed satisfies RoomEventType,
          (_track, _publication) => {
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          }
        );

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
    setParticipantCount(0);
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
    participantCount,
    videoRef,
    room: roomRef.current,
  };
}
