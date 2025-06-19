// src/hooks/useMarketTransactions.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';
import { useWallet } from '@nemoprotocol/wallet-kit';
import { useSearchParams } from 'next/navigation';


export interface MarketTransaction {
  tokenLogo: string;
  id: string;
  tradeTime: number;
  maturity: number;
  asset: string;
  tradeType: 'ADD' | 'BUY' | 'SELL' | string;
  processType: 'success' | 'failed' | '' | string;
  amount: string;
  tx: string;
}

export interface MarketTransactionsData {
  count: number;                    // 总条数
  data: MarketTransaction[];        // 列表
  page: {
    pageIndex: number;
    pageSize: number;
  };
}

export interface MarketTransactionsResponse {
  count: number;
  data: MarketTransaction[];
  msg: string;
  page: { pageIndex: number; pageSize: number };
}



export interface UseMarketTransactionsParams {
  pageSize?: number;   // 默认 10
  pageIndex?: number;  // 默认 1
  /** 是否在参数变化时自动请求，默认 true */
  autoFetch?: boolean;
}

export interface UseMarketTransactionsResult {
  data: MarketTransactionsData | null;
  loading: boolean;
  error: AxiosError | null;
  refetch: () => void;

  // 便于分页控制
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

/* =======================================================
 *                        Hook
 * ======================================================= */
export function useMarketTransactions(
  {
    pageSize: initSize = 10,
    pageIndex: initIdx = 1,
    autoFetch = true,
  }: UseMarketTransactionsParams = {},
): UseMarketTransactionsResult {
  /* ------------------------------------------------------------------ */
  /* 计算最终要用的地址：mockAddress（dev 环境） > 钱包 address          */
  /* ------------------------------------------------------------------ */
  const { address } = useWallet();
  const searchParams = useSearchParams();           // app-router
  const mockAddressRaw = searchParams.get("mockAddress");

  // pages-router 写法：
  // const { query } = useRouter();
  // const mockAddressRaw = query.mockAddress as string | undefined;

  const effectiveAddress =
    process.env.NEXT_PUBLIC_DEBUG && mockAddressRaw
      ? mockAddressRaw
      : address;

  /* ------------------------- 组件状态 ------------------------------ */
  const [data, setData] = useState<MarketTransactionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);
  const [pageSize, setPageSize] = useState(initSize);
  const [pageIndex, setPageIndex] = useState(initIdx);

  const cancelRef = useRef<CancelTokenSource>();

  /* --------------------------- 请求函数 --------------------------- */
  const fetchData = useCallback(async () => {

    setLoading(true);
    setError(null);

    cancelRef.current?.cancel("abort previous");
    const source = axios.CancelToken.source();
    cancelRef.current = source;

    try {
      const res = await http.get<MarketTransactionsResponse>(
        "/api/v1/market/transactions",
        {
          cancelToken: source.token,
          params: { pageSize, pageIndex },
          headers: { userAddress: effectiveAddress },  // ← 用替换后的地址
        },
      );

      const { msg, ...payload } = res.data;
      if (msg === "success") {
        setData({
          count: payload.count,
          data: payload.data,
          page: payload.page,
        });
      } else {
        throw new Error(msg);
      }
    } catch (err) {
      if (!axios.isCancel(err)) setError(err as AxiosError);
    } finally {
      setLoading(false);
    }
  }, [pageSize, pageIndex, effectiveAddress]);

  /* --------------------------- 副作用 ----------------------------- */
  useEffect(() => () => cancelRef.current?.cancel("unmount"), []);
  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch, effectiveAddress]);

  /* --------------------------- 返回值 ----------------------------- */
  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setPageSize,
    setPageIndex,
  };
}
