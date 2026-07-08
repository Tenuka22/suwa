"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResizeMode, Video } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getScreenTitle } from "@suwa/app-info";
import {
  ArrowLeft,
  Maximize,
  MessageCircle,
  Pause,
  Play,
  Send,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Input } from "@/components/design/ui/input";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { getMediaUrl } from "@/utils/media-url";
import { orpc } from "@/utils/orpc";

export default function MaterialDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { materialId } = useLocalSearchParams<{ materialId?: string }>();
  const id = Array.isArray(materialId) ? materialId[0] : materialId;

  const isWeb = Platform.OS === "web";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentText, setCommentText] = useState("");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userId = "patient-demo";

  useEffect(() => {
    if (!isWeb) return;
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [isWeb]);

  useEffect(() => {
    if (isWeb && videoRef.current) {
      if (paused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      videoRef.current.muted = muted;
    }
  }, [isWeb, paused, muted]);

  const materialsQuery = useQuery(
    orpc.listPublicMaterials.queryOptions({
      input: { page: 1, pageSize: 100 },
    })
  );
  const material = Array.isArray(materialsQuery.data)
    ? materialsQuery.data.find((m: any) => m.id === id)
    : undefined;
  const videoUri = material?.fileKey ? getMediaUrl(material.fileKey) : null;

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
      onMutate: async () => {
        const queryKey = orpc.getMaterialLikeStatus.queryKey({
          input: { materialId: id ?? "", userId },
        });
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, (old: any) => ({
          liked: old ? !old.liked : true,
        }));
        return { previous };
      },
      onError: (_err, _vars, context) => {
        const queryKey = orpc.getMaterialLikeStatus.queryKey({
          input: { materialId: id ?? "", userId },
        });
        if (context?.previous !== undefined) {
          queryClient.setQueryData(queryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["getMaterialLikeStatus"] });
      },
    })
  );

  const commentsQueryKey = orpc.listMaterialComments.queryKey({
    input: { materialId: id ?? "" },
  });
  const addCommentMutation = useMutation(
    orpc.addMaterialComment.mutationOptions({
      onMutate: async (newComment) => {
        await queryClient.cancelQueries({ queryKey: commentsQueryKey });
        const previous = queryClient.getQueryData(commentsQueryKey);
        queryClient.setQueryData(commentsQueryKey, (old: any) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            userId: newComment.userId,
            text: newComment.text,
            createdAt: new Date().toISOString(),
          },
        ]);
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(commentsQueryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      },
      onSuccess: () => {
        setCommentText("");
      },
    })
  );

  const handleFullscreen = () => {
    if (isWeb && videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const isLiked = likeQuery.data?.liked ?? false;

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

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
      <Stack.Screen options={{ headerShown: false, title: getScreenTitle("native:patient:materials:detail") }} />

      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-lg bg-background pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Video Player */}
        <View className="bg-neutral-900" style={{ aspectRatio: 16 / 9 }}>
          {videoUri ? (
            isWeb ? (
              <video
                ref={videoRef}
                src={videoUri}
                className="h-full w-full"
                muted={muted}
                autoPlay
                playsInline
                controls={isFullscreen}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                style={{ display: "block", objectFit: "contain" }}
              />
            ) : (
              <Video
                className="h-full w-full"
                isMuted
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                source={{ uri: videoUri }}
                useNativeControls
              />
            )
          ) : (
            <View className="items-center justify-center bg-background-subtle" style={{ aspectRatio: 4 / 3 }}>
              <Text className="font-serif text-foreground-muted text-title">
                No media available
              </Text>
            </View>
          )}
        </View>

        {/* Video info — YouTube style */}
        <View className="mx-auto w-full max-w-3xl px-lg gap-lg">
          <View className="flex-row items-center gap-md pt-md">
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-primary-subtle"
              onPress={() => {
                if (material.doctorId) {
                  router.push(`/doctors/${material.doctorId}`);
                }
              }}
            >
              <Text className="font-poppins-medium text-caption text-primary">
                {material.doctorName?.[0] ?? "S"}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1"
              onPress={() => {
                if (material.doctorId) {
                  router.push(`/doctors/${material.doctorId}`);
                }
              }}
            >
              <Text className="font-sans text-caption text-foreground-secondary">
                {material.doctorName ?? "Suwa"}
              </Text>
              <Text className="font-sans text-micro text-foreground-muted">
                {formatDuration(material.durationSeconds)} · {formatDate(material.createdAt)}
              </Text>
            </Pressable>
          </View>

          <Text className="font-serif text-primary text-title">
            {material.title}
          </Text>

          {material.description && (
            <Text className="font-sans text-body text-foreground-secondary leading-relaxed">
              {material.description}
            </Text>
          )}

          {material.tags && material.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {material.tags.map((tag: string) => (
                <View key={tag} className="rounded-full bg-primary-subtle px-3 py-1">
                  <Text className="font-sans text-micro text-primary">#{tag}</Text>
                </View>
              ))}
            </View>
          )}

        <View className="flex-row items-center gap-sm">
          <MessageCircle className="text-primary" size={20} />
          <Text className="font-serif text-primary text-title">Comments</Text>
          <Text className="font-sans text-caption text-foreground-muted">
            {commentsQuery.data?.length ?? 0}
          </Text>
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
        </View>
      </ScrollView>

      <ScreenBottomBar
        leftActions={[
          {
            className: "rounded-full bg-background-subtle/60",
            icon: paused ? (
              <Play className="text-foreground" size={20} />
            ) : (
              <Pause className="text-foreground" size={20} />
            ),
            label: paused ? "Play" : "Pause",
            onPress: () => setPaused(!paused),
          },
          {
            className: "rounded-full bg-background-subtle/60",
            icon: muted ? (
              <VolumeX className="text-foreground" size={20} />
            ) : (
              <Volume2 className="text-foreground" size={20} />
            ),
            label: muted ? "Unmute" : "Mute",
            onPress: () => setMuted(!muted),
          },
          {
            className: "rounded-full bg-background-subtle/60",
            icon: <Maximize className="text-foreground" size={20} />,
            label: "Fullscreen",
            onPress: handleFullscreen,
          },
          {
            active: isLiked,
            activeClassName: "rounded-full bg-rose-600/70 backdrop-blur-md",
            icon: (
              <ThumbsUp
                className={
                  isLiked ? "fill-white text-white" : "text-foreground"
                }
                size={20}
              />
            ),
            label: isLiked ? "Liked" : "Like",
            onPress: () =>
              toggleLikeMutation.mutate({
                materialId: id ?? "",
                userId,
              }),
          },
          {
            className: "rounded-full bg-background-subtle/60",
            icon: <ThumbsDown className="text-foreground" size={20} />,
            label: "Dislike",
            onPress: () =>
              toggleLikeMutation.mutate({
                materialId: id ?? "",
                userId,
              }),
          },
        ]}
        returnAction={{
          href: "/(patient)",
          icon: <ArrowLeft className="text-foreground" size={24} />,
        }}
      />
    </View>
  );
}
