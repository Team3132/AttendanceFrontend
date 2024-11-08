import { QueryClient, QueryKey } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "backend";
import SuperJSON from "superjson";

const backendUrl = new URL(`${import.meta.env.VITE_BACKEND_URL}/trpc`);

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: SuperJSON,
      url: backendUrl.toString(),
      fetch: async (url, options) => {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});
try {
  // add websocket listener
  const ws = new WebSocket(
    `ws${backendUrl.protocol === "https:" ? "s" : ""}://${backendUrl.host}/api/ws`,
  );

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data) as QueryKey;
    queryClient.invalidateQueries({
      queryKey: data,
    });
  });
} catch (error) {
  console.error(error);
}
