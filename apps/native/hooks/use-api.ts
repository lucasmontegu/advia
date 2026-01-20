// apps/native/hooks/use-api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/query-client';

// ============ User Hooks ============

export function useUserProfile() {
  return useQuery(api.user.getProfile.queryOptions());
}

export function useUserStats() {
  return useQuery(api.user.getStats.queryOptions());
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { theme?: 'light' | 'dark' | 'auto'; language?: 'en' | 'es'; notificationsEnabled?: boolean }) =>
      api.user.updateSettings.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// ============ Alerts Hooks ============

export function useActiveAlerts(latitude: number, longitude: number, enabled = true) {
  return useQuery({
    ...api.alerts.getActive.queryOptions({ latitude, longitude }),
    enabled: enabled && latitude !== 0 && longitude !== 0,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

export function useAlertHistory() {
  return useQuery(api.alerts.getHistory.queryOptions());
}

// ============ Locations Hooks ============

export function useLocations() {
  return useQuery(api.locations.list.queryOptions());
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; latitude: number; longitude: number; isPrimary?: boolean; notifyAlerts?: boolean }) =>
      api.locations.create.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; name?: string; latitude?: number; longitude?: number; notifyAlerts?: boolean }) =>
      api.locations.update.call(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.locations.delete.call({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useSetPrimaryLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.locations.setPrimary.call({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// ============ Chat Hooks ============

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatLocation = {
  latitude: number;
  longitude: number;
};

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (params: {
      message: string;
      history?: ChatMessage[];
      location?: ChatLocation;
      onChunk?: (chunk: string) => void;
    }) => {
      // For streaming, we need to use the iterator returned by the handler
      const stream = api.chat.sendMessage.call({
        message: params.message,
        history: params.history,
        location: params.location,
      });

      let fullContent = '';

      for await (const chunk of stream as AsyncIterable<{ type: 'text' | 'done'; content?: string }>) {
        if (chunk.type === 'text' && chunk.content) {
          fullContent += chunk.content;
          params.onChunk?.(fullContent);
        }
      }

      return fullContent;
    },
  });
}
