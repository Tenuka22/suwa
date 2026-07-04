import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client, orpc } from "@/utils/orpc";

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
    mutationFn: (input: { id: string }) => client.deleteMaterial(input),
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
    mutationFn: (
      input: Parameters<typeof client.updateMaterial>[0]
    ) => client.updateMaterial(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listMaterials.queryKey({
          input: { page: 1, pageSize: 50 },
        }),
      });
    },
  });
}

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
    mutationFn: (
      input: Parameters<typeof client.createHubChannel>[0]
    ) => client.createHubChannel(input),
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
    mutationFn: (
      input: Parameters<typeof client.updateHubChannel>[0]
    ) => client.updateHubChannel(input),
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
    mutationFn: (input: { id: string }) => client.deleteHubChannel(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listHubChannels.queryKey({
          input: { page: 1, pageSize: 100 },
        }),
      });
    },
  });
}

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
    mutationFn: (
      input: Parameters<typeof client.createPlaylist>[0]
    ) => client.createPlaylist(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orpc.listPlaylists.queryKey({
          input: { page: 1, pageSize: 100 },
        }),
      });
    },
  });
}
