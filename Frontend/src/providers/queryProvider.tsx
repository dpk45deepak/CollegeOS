"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { registerQueryCacheClearer, useAuthStore } from "@/lib/auth/authStore";
import { registerSocketQueryClient, useRealtimeSync } from "@/lib/socket/socketClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const initializeAuth = useAuthStore((s) => s.initialize);

  useEffect(() => {
    registerQueryCacheClearer(() => queryClient.clear());
    registerSocketQueryClient(queryClient);
    initializeAuth();
    return () => registerSocketQueryClient(null);
  }, [initializeAuth, queryClient]);

  useRealtimeSync();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
