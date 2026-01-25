// apps/native/lib/query-client.ts
import type { AppRouterClient } from "@driwet/api/routers/index";

import { env } from "@driwet/env/mobile";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

// Query client with persistence-friendly defaults
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1000 * 60 * 60 * 24, // 24 hours
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 2,
		},
	},
});

// AsyncStorage persister for offline-first support
export const asyncStoragePersister = createAsyncStoragePersister({
	storage: AsyncStorage,
	key: "driwet-query-cache",
});

// oRPC link with auth cookie forwarding
const link = new RPCLink({
	url: `${env.EXPO_PUBLIC_SERVER_URL}/api/rpc`,
	credentials: "omit", // Required when manually setting Cookie header
	headers: async () => {
		let cookies = authClient.getCookie();
		if (__DEV__) {
			console.log("[API] Raw cookie:", cookies);
		}
		if (cookies) {
			// Clean up malformed cookie - remove leading "; " if present
			cookies = cookies.replace(/^;\s*/, "");
			if (__DEV__) {
				console.log("[API] Cleaned cookie:", cookies.substring(0, 80) + "...");
			}
			return { Cookie: cookies };
		}
		return {};
	},
});

// Type-safe oRPC client
export const apiClient: AppRouterClient = createORPCClient(link);

// Export as orpc for direct calls (non-hook usage)
export const orpc = apiClient;

// TanStack Query utilities for oRPC (provides useQuery/useMutation hooks)
export const api = createTanstackQueryUtils(apiClient);
