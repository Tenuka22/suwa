"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResizeMode, Video } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Maximize,
  MessageCircle,
  Minimize,
  Pause,
  Play,
  Send,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { env } from "@suwa/env/native";
import { orpc } from "@/utils/orpc";

export default function MaterialDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { materialId } = useLocalSearchParams<{ materialId?: string }>();
  const id = Array.isArray(materialId) ? materialId[0] : materialId;

  const [commentText, setCommentText] = useState("");
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const videoRef = useRef<Video>(null);
  const userId = "patient-demo";

  const videoUri = id
    ? `${env.EXPO_PUBLIC_SERVER_URL}/materials/${id}/file`
    : null;

  const materialsQuery = useQuery(
    orpc.listPublicMaterials.queryOptions({
      input: { page: 1, pageSize: 1 },
    })
  );
  const material = (materialsQuery.data ?? []).find((m: any) => m.id === id);

  const likeQuery = useQuery(
    orpc.getMaterialLikeStatus.queryOptions({
      input: { materialId: id ?? "", userId },
    })
  );

  const commentsQuery = useQuery(
    orpc.listMaterialComments.queryOptions({
      input: { materialId: id ?? "" },
    })
  );

  const toggleLikeMutation = useMutation(
    orpc.toggleLikeMaterial.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getMaterialLikeStatus"] });
      },
    })
  );

  const addCommentMutation = useMutation(
    orpc.addMaterialComment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["listMaterialComments"],
        });
        setCommentText("");
      },
    })
  );

  const isLiked = likeQuery.data?.liked ?? false;

  if (!material) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-sans text-body text-foreground-muted">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen
        contentClassName="flex-1 gap-lg pt-12 px-lg bg-background"
        scrollClassName="flex-1 bg-background"
      >
        {/* Video Player */}
        <View className="overflow-hidden rounded-2xl bg-black">
          {videoUri ? (
            <>
              <Video
                className="aspect-video w-full"
                isMuted={muted}
                ref={videoRef}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={!paused}
                source={{ uri: videoUri }}
                useNativeControls={false}
              />
              <View className="absolute inset-0" />
              {/* Controls overlay */}
              <View className="absolute inset-x-0 bottom-0 flex-row items-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-4 pt-12 pb-3">
                <Pressable onPress={() => setPaused(!paused)}>
                  {paused ? (
                    <Play className="text-white" fill="white" size={24} />
                  ) : (
                    <Pause className="text-white" fill="white" size={24} />
                  )}
                </Pressable>
                <Pressable onPress={() => setMuted(!muted)}>
                  {muted ? (
                    <VolumeX className="text-white" size={24} />
                  ) : (
                    <Volume2 className="text-white" size={24} />
                  )}
                </Pressable>
                <View className="flex-1" />
                <Pressable
                  onPress={() => {
                    setFullscreen(!fullscreen);
                    videoRef.current?.presentFullscreenPlayer();
                  }}
                >
                  {fullscreen ? (
                    <Minimize className="text-white" size={24} />
                  ) : (
                    <Maximize className="text-white" size={24} />
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View className="aspect-video items-center justify-center bg-background-subtle">
              <Text className="font-serif text-foreground-muted text-title">
                Loading video...
              </Text>
            </View>
          )}
        </View>

        {/* Title & Doctor */}
        <View className="gap-xxs">
          <Text className="font-serif text-primary text-title">
            {material.title}
          </Text>
          {material.doctorName && (
            <Text className="font-sans text-caption text-foreground-secondary">
              by {material.doctorName}
            </Text>
          )}
        </View>

        {/* Description */}
        {material.description && (
          <Text className="font-sans text-body text-foreground-secondary leading-relaxed">
            {material.description}
          </Text>
        )}

        {/* Like / Dislike */}
        <View className="flex-row items-center gap-lg">
          <Pressable
            className="flex-row items-center gap-2 rounded-full border border-border px-4 py-2"
            onPress={() =>
              toggleLikeMutation.mutate({
                materialId: id ?? "",
                userId,
              })
            }
          >
            <ThumbsUp
              className={
                isLiked ? "fill-rose-500 text-rose-500" : "text-foreground"
              }
              size={20}
            />
            <Text className="font-sans text-caption text-foreground">Like</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center gap-2 rounded-full border border-border px-4 py-2"
            onPress={() =>
              toggleLikeMutation.mutate({
                materialId: id ?? "",
                userId,
              })
            }
          >
            <ThumbsDown className="text-foreground" size={20} />
            <Text className="font-sans text-caption text-foreground">
              Dislike
            </Text>
          </Pressable>
        </View>

        {/* Comments Header */}
        <View className="flex-row items-center gap-sm">
          <MessageCircle className="text-primary" size={20} />
          <Text className="font-serif text-primary text-title">Comments</Text>
        </View>

        {/* Comments List */}
        {commentsQuery.data && commentsQuery.data.length > 0 ? (
          <View className="gap-md">
            {commentsQuery.data.map((comment: any) => (
              <View
                className="rounded-2xl bg-background-elevated p-md"
                key={comment.id}
              >
                <Text className="font-sans text-caption text-foreground-secondary">
                  {comment.userId}
                </Text>
                <Text className="mt-1 font-sans text-body text-foreground">
                  {comment.text}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="font-sans text-caption text-foreground-muted">
            No comments yet.
          </Text>
        )}

        {/* Comment Input */}
        <View className="flex-row items-center gap-md pb-8">
          <Input
            className="flex-1 py-3"
            inputContainerClassName="rounded-xl bg-background-elevated"
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            value={commentText}
          />
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-primary"
            disabled={!commentText.trim() || addCommentMutation.isPending}
            onPress={() => {
              if (commentText.trim() && id) {
                addCommentMutation.mutate({
                  materialId: id,
                  userId,
                  text: commentText.trim(),
                });
              }
            }}
          >
            <Send className="text-primary-foreground" size={18} />
          </Pressable>
        </View>
      </Screen>

      <ScreenBottomBar
        returnAction={{
          href: "/(patient)",
          icon: <ArrowLeft className="text-foreground" size={24} />,
        }}
      />
    </View>
  );
}
