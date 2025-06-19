// src/hooks/useLeaderboard.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';
import { useWallet } from '@nemoprotocol/wallet-kit';
import { useSearchParams } from 'next/navigation';

/* ────────────────── 类型定义 ────────────────── */
export interface LeaderboardItem {
  rank: number;
  address: string;
  pointsPerDay: number;
  totalPoints: number;
}

export interface LeaderboardData {
  count: number;
  data: LeaderboardItem[];
  page: { pageIndex: number; pageSize: number };

  /* 如果后端在响应里附带了“我的信息”，可在这里追加字段 */
  // my?: { rank: number; pointsPerDay: number; totalPoints: number };
}

export interface LeaderboardResponse {
  msg: string;          // "success"
  count: number;
  data: LeaderboardItem[];
  page: { pageIndex: number; pageSize: number };

  // my?: { ... }         // ← 预留，你可以根据后端返回补上
}

export interface UseLeaderboardParams {
  pageSize?: number;     // 默认 10
  pageIndex?: number;     // 默认 1
  autoFetch?: boolean;    // 默认 true
}

export interface UseLeaderboardResult {
  data: LeaderboardData | null;
  loading: boolean;
  error: AxiosError | null;
  refetch: () => void;

  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

/* ────────────────── Hook 实现 ────────────────── */
export function useLeaderboard(
  {
    pageSize: initSize = 10,
    pageIndex: initIdx = 1,
    autoFetch = true,
  }: UseLeaderboardParams = {},
): UseLeaderboardResult {
  /* ---------- Wallet / mockAddress ---------- */
  const { address } = useWallet();
  const searchParams = useSearchParams();
  const mockAddressRaw = searchParams.get('mockAddress');
  console.log(process.env.NODE_ENV,process.env.NEXT_PUBLIC_HOST,process.env.NEXT_PUBLIC_DEBUG, 'sixu')
  const effectiveAddress =
    process.env.NODE_ENV !== 'production' && mockAddressRaw
      ? mockAddressRaw
      : address;

  /* ---------- state ---------- */
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);
  const [pageSize, setPageSize] = useState(initSize);
  const [pageIndex, setPageIndex] = useState(initIdx);

  const cancelRef = useRef<CancelTokenSource>();

  /* ---------- 请求函数 ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    cancelRef.current?.cancel('abort previous');
    const source = axios.CancelToken.source();
    cancelRef.current = source;

    try {
      const res = await http.get<LeaderboardResponse>(
        '/api/v1/points/page',
        {
          cancelToken: source.token,
          params: { pageSize, pageIndex },
          headers: { userAddress: effectiveAddress || '' },  // 服务器如需用户地址可带上
        },
      );

      const { msg, ...payload } = res.data;
      if (msg === 'success') {
        setData({
          count: payload.count,
          data: payload.data,
          page: payload.page,
          // my  : payload.my,   ← 如果后端返回，可放开
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

  /* ---------- 副作用 ---------- */
  useEffect(() => () => cancelRef.current?.cancel('unmount'), []);
  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  /* ---------- 返回 ---------- */
  return {
    data,
    loading,
    error,
    refetch: fetchData,

    setPageSize,
    setPageIndex,
  };
}