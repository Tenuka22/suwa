'use client';

import { type Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaStream,
  type MediaStreamTrack as RNMediaStreamTrack,
} from "react-native-webrtc";

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

  const participantStreamsRef = useRef<
    Map<
      string,
      {
        audioTracks: MediaStreamTrack[];
        videoTracks: MediaStreamTrack[];
        streamURL: string;
      }
    >
  >(new Map());

  const connect = useCallback(
    async (url: string, token: string) => {
      setIsConnecting(true);
      setError(null);
      participantStreamsRef.current.clear();

      try {
        const { Room: RoomClass } = await import("livekit-client");
        const room = new RoomClass({
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
        });

        room.on(RoomEvent.Connected, () => {
          setIsConnected(true);
          setIsConnecting(false);
          options.onConnected?.();

          for (const [, publication] of room.localParticipant
            .trackPublications) {
            if (
              publication.track?.kind === Track.Kind.Video &&
              publication.track.mediaStreamTrack
            ) {
              try {
                const stream = new MediaStream([
                  publication.track.mediaStreamTrack,
                ] as unknown as RNMediaStreamTrack[]);
                const url = stream.toURL();
                if (url) {
                  setLocalStreamURL(url);
                }
              } catch {}
            }
          }

          const map = participantStreamsRef.current;
          const initial: RemoteParticipantInfo[] = [];
          for (const [, p] of room.remoteParticipants) {
            const entry = {
              audioTracks: [] as MediaStreamTrack[],
              videoTracks: [] as MediaStreamTrack[],
              streamURL: "",
            };
            for (const [, pub] of p.trackPublications) {
              if (
                pub.track?.kind === Track.Kind.Video &&
                pub.track.mediaStreamTrack
              ) {
                entry.videoTracks.push(pub.track.mediaStreamTrack);
              }
              if (
                pub.track?.kind === Track.Kind.Audio &&
                pub.track.mediaStreamTrack
              ) {
                entry.audioTracks.push(pub.track.mediaStreamTrack);
              }
            }
            map.set(p.identity, entry);
            const combined = [...entry.audioTracks, ...entry.videoTracks];
            const displayName = formatParticipantLabel(p.identity);
            if (combined.length > 0) {
              try {
                const stream = new MediaStream(
                  combined as unknown as RNMediaStreamTrack[]
                );
                const streamURL = stream.toURL() ?? "";
                entry.streamURL = streamURL;
                initial.push({
                  identity: p.identity,
                  streamURL,
                  isAnonymous: false,
                  displayName,
                });
              } catch {
                initial.push({
                  identity: p.identity,
                  streamURL: "",
                  isAnonymous: false,
                  displayName,
                });
              }
            } else {
              initial.push({
                identity: p.identity,
                streamURL: "",
                isAnonymous: false,
                displayName,
              });
            }
          }
          if (initial.length > 0) {
            setRemoteParticipants(initial);
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setIsConnecting(false);
          setRemoteParticipants([]);
          setLocalStreamURL(null);
          setRoom(null);
          participantStreamsRef.current.clear();
          options.onDisconnected?.();
        });

        room.on(RoomEvent.ParticipantConnected, (participant) => {
          participantStreamsRef.current.set(participant.identity, {
            audioTracks: [],
            videoTracks: [],
            streamURL: "",
          });
          setRemoteParticipants((prev) => {
            if (prev.some((p) => p.identity === participant.identity)) {
              return prev;
            }
            const displayName = formatParticipantLabel(participant.identity);
            return [
              ...prev,
              {
                identity: participant.identity,
                streamURL: "",
                isAnonymous: false,
                displayName,
              },
            ];
          });
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          participantStreamsRef.current.delete(participant.identity);
          setRemoteParticipants((prev) =>
            prev.filter((p) => p.identity !== participant.identity)
          );
        });

        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (participant.isLocal) {
            return;
          }

          const identity = participant.identity;
          const map = participantStreamsRef.current;
          let entry = map.get(identity);
          if (!entry) {
            entry = { audioTracks: [], videoTracks: [], streamURL: "" };
            map.set(identity, entry);
          }

          if (track.kind === Track.Kind.Audio && track.mediaStreamTrack) {
            if (!entry.audioTracks.includes(track.mediaStreamTrack)) {
              entry.audioTracks.push(track.mediaStreamTrack);
            }
          } else if (
            track.kind === Track.Kind.Video &&
            track.mediaStreamTrack &&
            !entry.videoTracks.includes(track.mediaStreamTrack)
          ) {
            entry.videoTracks.push(track.mediaStreamTrack);
          }

          const allTracks = [...entry.audioTracks, ...entry.videoTracks];
          let streamURL = "";
          if (allTracks.length > 0) {
            try {
              const stream = new MediaStream(
                allTracks as unknown as RNMediaStreamTrack[]
              );
              streamURL = stream.toURL() ?? "";
              entry.streamURL = streamURL;
            } catch {
              streamURL = entry.streamURL;
            }
          }

          setRemoteParticipants((prev) => {
            const existing = prev.find((p) => p.identity === identity);
            if (existing) {
              return prev.map((p) =>
                p.identity === identity
                  ? { ...p, streamURL: streamURL || p.streamURL }
                  : p
              );
            }
            return [
              ...prev,
              {
                identity,
                streamURL,
                isAnonymous: false,
                displayName: formatParticipantLabel(identity),
              },
            ];
          });
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach();
        });

        room.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (
            publication.track?.kind === Track.Kind.Video &&
            publication.track?.mediaStreamTrack
          ) {
            try {
              const stream = new MediaStream([
                publication.track.mediaStreamTrack,
              ] as unknown as RNMediaStreamTrack[]);
              const url = stream.toURL();
              if (url) {
                setLocalStreamURL(url);
              }
            } catch {}
          }
        });

        await room.connect(url, token);

        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        roomRef.current = room;
        setRoom(room);
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
    setRemoteParticipants([]);
    setLocalStreamURL(null);
    setRoom(null);
    participantStreamsRef.current.clear();
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      const enabled = !room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(enabled);
      setIsCameraEnabled(enabled);
      if (!enabled) {
        setLocalStreamURL(null);
      }
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
      participantStreamsRef.current.clear();
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
