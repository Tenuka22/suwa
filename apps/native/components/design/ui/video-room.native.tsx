"use client";

import { StyleSheet } from "react-native";
import { RTCView } from "react-native-webrtc";

import {
  VideoRoomBase,
  type VideoRoomProps,
} from "@/components/design/ui/video-room-base";

export function VideoRoom(props: VideoRoomProps) {
  return (
    <VideoRoomBase
      {...props}
      renderStream={(streamURL, mirror) => (
        <RTCView
          mirror={mirror}
          objectFit="cover"
          streamURL={streamURL}
          style={StyleSheet.absoluteFillObject}
        />
      )}
    />
  );
}
