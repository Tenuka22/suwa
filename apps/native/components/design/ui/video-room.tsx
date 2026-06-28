"use client";

import { Text, View } from "react-native";

import {
  VideoRoomBase,
  type VideoRoomProps,
} from "@/components/design/ui/video-room-base";

export function VideoRoom(props: VideoRoomProps) {
  return (
    <VideoRoomBase
      {...props}
      renderStream={() => (
        <View className="flex-1 items-center justify-center bg-black">
          <Text className="px-6 text-center text-sm text-white">
            Live video preview is only available in the native app.
          </Text>
        </View>
      )}
    />
  );
}
