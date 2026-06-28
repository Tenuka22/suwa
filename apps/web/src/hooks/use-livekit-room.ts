import {
  type Participant,
  type Room,
  RoomEvent,
  type RoomEvent as RoomEventType,
} from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

const AUDIO_HISTORY_LENGTH = 40;

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
  const [room, setRoom] = useState<Room | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [audioLevelHistory, setAudioLevelHistory] = useState<
    Record<string, number[]>
  >({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const attachParticipantTracks = useCallback(
    (identity: string) => {
      const room = roomRef.current;
      if (!room) return;
      const participant = room.remoteParticipants.get(identity);
      if (!participant) return;

      for (const publication of participant.videoTrackPublications.values()) {
        if (publication.track?.kind === "video" && videoRef.current) {
          publication.track.attach(videoRef.current);
          break;
        }
      }
      for (const publication of participant.audioTrackPublications.values()) {
        if (publication.track?.kind === "audio" && audioRef.current) {
          publication.track.attach(audioRef.current);
          break;
        }
      }
    },
    []
  );

  const detachParticipantTracks = useCallback((identity: string) => {
    const room = roomRef.current;
    if (!room) return;
    const participant = room.remoteParticipants.get(identity);
    if (!participant) return;

    for (const publication of participant.videoTrackPublications.values()) {
      publication.track?.detach();
    }
    for (const publication of participant.audioTrackPublications.values()) {
      publication.track?.detach();
    }
  }, []);

  const connect = useCallback(
    async (url: string, token: string) => {
      setIsConnecting(true);
      setError(null);

      try {
        const { Room } = await import("livekit-client");
        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: { height: 720, width: 1280 },
          },
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          publishDefaults: {
            videoCodec: "vp8",
          },
        });

        room.on(RoomEvent.Connected satisfies RoomEventType, () => {
          setIsConnected(true);
          setIsConnecting(false);
          setRoom(room);
          roomRef.current = room;
          options.onConnected?.();
        });

        room.on(RoomEvent.Disconnected satisfies RoomEventType, () => {
          setIsConnected(false);
          setIsConnecting(false);
          setRoom(null);
          options.onDisconnected?.();
        });

        room.on(RoomEvent.ParticipantConnected satisfies RoomEventType, () => {
          setParticipantCount(room.remoteParticipants.size);
        });

        room.on(
          RoomEvent.ParticipantDisconnected satisfies RoomEventType,
          () => {
            setParticipantCount(room.remoteParticipants.size);
          }
        );

        room.on(
          RoomEvent.TrackSubscribed satisfies RoomEventType,
          () => {
            // Track attachment is handled by the component via attachParticipantTracks
          }
        );

        room.on(
          RoomEvent.TrackUnsubscribed satisfies RoomEventType,
          (track) => {
            track.detach();
          }
        );

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          setActiveSpeakers(speakers);
          setAudioLevelHistory((prev) => {
            const next = { ...prev };
            const allParticipants = [
              room.localParticipant,
              ...Array.from(room.remoteParticipants.values()),
            ];

            for (const p of allParticipants) {
              const history = next[p.identity] || [];
              const updated = [...history, p.audioLevel].slice(
                -AUDIO_HISTORY_LENGTH
              );
              next[p.identity] = updated;
            }
            return next;
          });
        });

        room.on(
          RoomEvent.LocalTrackPublished satisfies RoomEventType,
          (publication) => {
            if (publication.track?.kind === "video" && localVideoRef.current) {
              publication.track?.attach(localVideoRef.current);
            }
          }
        );

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
    setParticipantCount(0);
    setRoom(null);
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
    localVideoRef,
    audioRef,
    room,
    activeSpeakers,
    audioLevelHistory,
    attachParticipantTracks,
    detachParticipantTracks,
  };
}
