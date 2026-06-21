"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResizeMode, Video } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MessageCircle,
  Pause,
  Play,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { ScreenBottomBar } from "@/components/design/ui/screen-bottom-bar";
import { orpc } from "@/utils/orpc";

export default function MaterialDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { materialId } = useLocalSearchParams<{ materialId?: string }>();
  const id = Array.isArray(materialId) ? materialId[0] : materialId;

  const [commentText, setCommentText] = useState("");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoLocalUri, setVideoLocalUri] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const videoRef = useRef<Video>(null);
  const userId = "patient-demo";

  useEffect(() => {
    if (!id) {
      return;
    }

    console.log(`[materialId] mounting with id=${id}`);
    let active = true;

    orpc.getMaterialFile.call({ materialId: id }).then((file) => {
      console.log(`[materialId] file received: size=${file.size} type=${file.type} name=${file.name}`);
      if (!(active && file)) {
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (active && typeof reader.result === "string") {
          console.log(`[materialId] dataUrl ready: length=${reader.result.length}`);
          setVideoLocalUri(reader.result);
          setFileLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }).catch((err) => {
      console.error(`[materialId] error:`, err);
      if (active) {
        setFileLoading(false);
      }
    });

    return () => {
      console.log(`[materialId] unmounting`);
      active = false;
    };
  }, [id]);

  const materialsQuery = useQuery(
    orpc.listPublicMaterials.queryOptions({
      input: { page: 1, pageSize: 1 },
    })
  );
  const material = (materialsQuery.data ?? []).find((m) => m.id === id);

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
        <View className="min-h-64 overflow-hidden rounded-2xl bg-black">
          {videoLocalUri ? (
            <Video
              className="aspect-video w-full"
              isMuted={muted}
              ref={videoRef}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={!paused}
              source={{ uri: videoLocalUri }}
              useNativeControls={false}
            />
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
