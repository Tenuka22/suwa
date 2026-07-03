import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

// --- Materials ---

export function useHubMaterials(input?: {
  channelId?: string;
  playlistId?: string;
  visibility?: "public" | "unlisted" | "private";
  status?: "uploading" | "processing" | "ready" | "failed";
  page?: number;
  pageSize?: number;
}) {
  return useQuery(
    orpc.listMaterials.queryOptions({
      input: {
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 50,
        channelId: input?.channelId,
        playlistId: input?.playlistId,
        visibility: input?.visibility,
        status: input?.status,
      },
    })
  );
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => orpc.deleteMaterial.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listMaterials.queryKey({
          input: { page: 1, pageSize: 50 },
        }),
      });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof orpc.updateMaterial.call>[0]) =>
      orpc.updateMaterial.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listMaterials.queryKey({
          input: { page: 1, pageSize: 50 },
        }),
      });
    },
  });
}

// --- Channels ---

export function useHubChannels() {
  return useQuery(
    orpc.listHubChannels.queryOptions({
      input: { page: 1, pageSize: 100 },
    })
  );
}

export function useCreateHubChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof orpc.createHubChannel.call>[0]) =>
      orpc.createHubChannel.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listHubChannels.queryKey({
          input: { page: 1, pageSize: 100 },
        }),
      });
    },
  });
}

export function useUpdateHubChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof orpc.updateHubChannel.call>[0]) =>
      orpc.updateHubChannel.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listHubChannels.queryKey({
          input: { page: 1, pageSize: 100 },
        }),
      });
    },
  });
}

export function useDeleteHubChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => orpc.deleteHubChannel.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listHubChannels.queryKey({
          input: { page: 1, pageSize: 100 },
        }),
      });
    },
  });
}

// --- Playlists ---

export function useHubPlaylists(input?: { channelId?: string }) {
  return useQuery(
    orpc.listPlaylists.queryOptions({
      input: {
        page: 1,
        pageSize: 100,
        channelId: input?.channelId,
      },
    })
  );
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof orpc.createPlaylist.call>[0]) =>
      orpc.createPlaylist.call(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listPlaylists.queryKey({
          input: { page: 1, pageSize: 100 },
        }),
      });
    },
  });
}
