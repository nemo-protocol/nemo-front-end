
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 根据需要自定义
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
