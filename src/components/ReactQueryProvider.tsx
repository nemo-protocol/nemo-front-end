'use client';

import { ReactNode, useState } from 'react';
import {
  QueryClientProvider,
  HydrationBoundary, // ⚠️ 若你用到了 RSC / SSR
  QueryClient,
} from '@tanstack/react-query';

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  // 确保只生成一次 client
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {/* 如果用 app router 并在 server 端做预取，可保留 HydrationBoundary。
         纯 CSR 项目删掉也行 */}
      <HydrationBoundary>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
