"use client";

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

interface ConnectMediaOptions {
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
}

const LOCAL_STREAM_ID = "__local__";

export const streamRegistry = {
  localStream: null as MediaStream | null,
  remoteStreams: new Map<string, MediaStream>(),
  localStreamURL: null as string | null,
};

function registerLocalStream(stream: MediaStream): string {
  streamRegistry.localStream = stream;
  streamRegistry.localStreamURL = LOCAL_STREAM_ID;
  return LOCAL_STREAM_ID;
}

function unregisterLocalStream(): void {
  if (streamRegistry.localStream) {
    for (const track of streamRegistry.localStream.getTracks()) {
      track.stop();
    }
    streamRegistry.localStream = null;
  }
  streamRegistry.localStreamURL = null;
}

function registerRemoteStream(identity: string, stream: MediaStream): void {
  const existing = streamRegistry.remoteStreams.get(identity);
  if (existing && existing !== stream) {
    for (const track of existing.getTracks()) {
      track.stop();
    }
  }
  streamRegistry.remoteStreams.set(identity, stream);
}

function unregisterRemoteStream(identity: string): void {
  const existing = streamRegistry.remoteStreams.get(identity);
  if (existing) {
    for (const track of existing.getTracks()) {
      track.stop();
    }
    streamRegistry.remoteStreams.delete(identity);
  }
}

function clearRegistry(): void {
  unregisterLocalStream();
  for (const [id] of streamRegistry.remoteStreams) {
    unregisterRemoteStream(id);
  }
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
  const [localStreamAspectRatio, setLocalStreamAspectRatio] = useState<
    number | null
  >(null);
  const [room, setRoom] = useState<Room | null>(null);

  const participantTracksRef = useRef<
    Map<
      string,
      { audioTracks: MediaStreamTrack[]; videoTracks: MediaStreamTrack[] }
    >
  >(new Map());
  const persistentStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const captureLocalStream = useCallback(
    (mediaStreamTrack: MediaStreamTrack) => {
      const stream = new MediaStream([mediaStreamTrack]);
      const id = registerLocalStream(stream);
      setLocalStreamURL(id);

      const settings = mediaStreamTrack.getSettings?.();
      if (settings?.width && settings?.height) {
        setLocalStreamAspectRatio(settings.width / settings.height);
      } else {
        setLocalStreamAspectRatio(null);
      }
    },
    []
  );

  const syncLocalPreview = useCallback((room_: Room) => {
    for (const [, publication] of room_.localParticipant.trackPublications) {
      if (
        publication.track?.kind === Track.Kind.Video &&
        publication.track.mediaStreamTrack
      ) {
        captureLocalStream(publication.track.mediaStreamTrack);
        return;
      }
    }
  }, [captureLocalStream]);

  const updateRemoteStream = useCallback(
    (identity: string) => {
      const tracks = participantTracksRef.current.get(identity);
      if (!tracks) return;

      const allTracks = [...tracks.audioTracks, ...tracks.videoTracks];
      if (allTracks.length > 0) {
        let stream = persistentStreamsRef.current.get(identity);
        if (!stream) {
          stream = new MediaStream();
          persistentStreamsRef.current.set(identity, stream);
          registerRemoteStream(identity, stream);
        }
        const existingTracks = new Set(stream.getTracks());
        const desiredTracks = new Set(allTracks);
        for (const track of existingTracks) {
          if (!desiredTracks.has(track)) {
            stream.removeTrack(track);
          }
        }
        for (const track of desiredTracks) {
          if (!existingTracks.has(track)) {
            stream.addTrack(track);
          }
        }
      } else {
        const existing = persistentStreamsRef.current.get(identity);
        if (existing) {
          persistentStreamsRef.current.delete(identity);
        }
        unregisterRemoteStream(identity);
      }

      setRemoteParticipants((prev) => {
        const existing = prev.find((p) => p.identity === identity);
        const url = allTracks.length > 0 ? identity : "";
        if (existing) {
          return prev.map((p) =>
            p.identity === identity ? { ...p, streamURL: url } : p
          );
        }
        return [
          ...prev,
          {
            identity,
            streamURL: url,
            isAnonymous: false,
            displayName: formatParticipantLabel(identity),
          },
        ];
      });
    },
    []
  );

  const buildInitialRemoteInfo = useCallback(
    (room_: Room) => {
      const result: RemoteParticipantInfo[] = [];
      for (const [, p] of room_.remoteParticipants) {
        const audioTracks: MediaStreamTrack[] = [];
        const videoTracks: MediaStreamTrack[] = [];
        for (const [, pub] of p.trackPublications) {
          if (pub.track?.kind === Track.Kind.Video && pub.track.mediaStreamTrack) {
            videoTracks.push(pub.track.mediaStreamTrack);
          }
          if (pub.track?.kind === Track.Kind.Audio && pub.track.mediaStreamTrack) {
            audioTracks.push(pub.track.mediaStreamTrack);
          }
        }
        const allTracks = [...audioTracks, ...videoTracks];
        if (allTracks.length > 0) {
          let stream = persistentStreamsRef.current.get(p.identity);
          if (!stream) {
            stream = new MediaStream();
            persistentStreamsRef.current.set(p.identity, stream);
            registerRemoteStream(p.identity, stream);
          }
          for (const track of allTracks) {
            stream.addTrack(track);
          }
        }
        participantTracksRef.current.set(p.identity, { audioTracks, videoTracks });
        const url =
          audioTracks.length > 0 || videoTracks.length > 0 ? p.identity : "";
        result.push({
          identity: p.identity,
          streamURL: url,
          isAnonymous: false,
          displayName: formatParticipantLabel(p.identity),
        });
      }
      return result;
    },
    []
  );

  const connect = useCallback(
    async (
      url: string,
      token: string,
      mediaOptions: ConnectMediaOptions = {}
    ) => {
      const cameraEnabled = mediaOptions.cameraEnabled ?? true;
      const microphoneEnabled = mediaOptions.microphoneEnabled ?? true;

      setIsConnecting(true);
      setError(null);
      setIsCameraEnabled(cameraEnabled);
      setIsMicEnabled(microphoneEnabled);
      if (!cameraEnabled) {
        setLocalStreamURL(null);
      }

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

          const initial = buildInitialRemoteInfo(room);
          setRemoteParticipants(initial);
          syncLocalPreview(room);
        });

        room.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setIsConnecting(false);
          setRemoteParticipants([]);
          setRoom(null);
          clearRegistry();
          options.onDisconnected?.();
        });

        room.on(RoomEvent.ParticipantConnected, (p) => {
          participantTracksRef.current.set(p.identity, {
            audioTracks: [],
            videoTracks: [],
          });
          setRemoteParticipants((prev) => {
            if (prev.some((item) => item.identity === p.identity)) {
              return prev;
            }
            return [
              ...prev,
              {
                identity: p.identity,
                streamURL: "",
                isAnonymous: false,
                displayName: formatParticipantLabel(p.identity),
              },
            ];
          });
        });

        room.on(RoomEvent.ParticipantDisconnected, (p) => {
          participantTracksRef.current.delete(p.identity);
          persistentStreamsRef.current.delete(p.identity);
          unregisterRemoteStream(p.identity);
          setRemoteParticipants((prev) =>
            prev.filter((item) => item.identity !== p.identity)
          );
        });

        room.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          const identity = participant.identity;
          let entry = participantTracksRef.current.get(identity);
          if (!entry) {
            entry = { audioTracks: [], videoTracks: [] };
            participantTracksRef.current.set(identity, entry);
          }

          if (track.kind === Track.Kind.Audio && track.mediaStreamTrack) {
            if (!entry.audioTracks.includes(track.mediaStreamTrack)) {
              entry.audioTracks.push(track.mediaStreamTrack);
            }
          } else if (track.kind === Track.Kind.Video && track.mediaStreamTrack) {
            if (!entry.videoTracks.includes(track.mediaStreamTrack)) {
              entry.videoTracks.push(track.mediaStreamTrack);
            }
          }

          updateRemoteStream(identity);
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
          const entry = participantTracksRef.current.get(participant.identity);
          if (entry && track.mediaStreamTrack) {
            entry.audioTracks = entry.audioTracks.filter(
              (t) => t !== track.mediaStreamTrack
            );
            entry.videoTracks = entry.videoTracks.filter(
              (t) => t !== track.mediaStreamTrack
            );
            updateRemoteStream(participant.identity);
          }
        });

        room.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (
            publication.track?.kind === Track.Kind.Video &&
            publication.track.mediaStreamTrack
          ) {
            captureLocalStream(publication.track.mediaStreamTrack);
          }
        });

        await room.connect(url, token);
        await room.localParticipant.setCameraEnabled(cameraEnabled);
        await room.localParticipant.setMicrophoneEnabled(microphoneEnabled);

        if (cameraEnabled) {
          syncLocalPreview(room);
        }

        roomRef.current = room;
        setRoom(room);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to connect";
        const error = err instanceof Error ? err : new Error(message);

        setError(message);
        setIsConnecting(false);
        options.onError?.(error);
        throw error;
      }
    },
    [options, buildInitialRemoteInfo, syncLocalPreview, captureLocalStream, updateRemoteStream]
  );

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      room.removeAllListeners();
      await room.disconnect();
      roomRef.current = null;
    }

    clearRegistry();
    participantTracksRef.current.clear();
    persistentStreamsRef.current.clear();

    setIsConnected(false);
    setIsConnecting(false);
    setRemoteParticipants([]);
    setLocalStreamURL(null);
    setLocalStreamAspectRatio(null);
    setIsCameraEnabled(true);
    setIsMicEnabled(true);
    setRoom(null);
  }, []);

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current;
    if (room) {
      const enabled = !room.localParticipant.isCameraEnabled;
      await room.localParticipant.setCameraEnabled(enabled);
      setIsCameraEnabled(enabled);
      if (!enabled) {
        unregisterLocalStream();
        setLocalStreamURL(null);
        setLocalStreamAspectRatio(null);
      } else {
        syncLocalPreview(room);
      }
    }
  }, [syncLocalPreview]);

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
      clearRegistry();
      participantTracksRef.current.clear();
      persistentStreamsRef.current.clear();
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
    localStreamAspectRatio,
    isCameraEnabled,
    isMicEnabled,
    toggleCamera,
    toggleMic,
    room,
  };
}
