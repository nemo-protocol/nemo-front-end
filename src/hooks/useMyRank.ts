'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';
import { useWallet } from '@nemoprotocol/wallet-kit';
import { useSearchParams } from 'next/navigation';

/* ────────────────── 类型定义 ────────────────── */
export interface MyRank {
  rank        : number;
  address     : string;
  pointsPerDay: number;
  totalPoints : number;
}

export interface MyRankResponse {
  msg  : string;           // "success"
  count: number;           // 通常=1
  data : MyRank[];         // 只会返回当前地址
  page : { pageIndex: number; pageSize: number };
}

export interface UseMyRankParams {
  /** 是否在地址就绪时自动调用，默认 true */
  autoFetch?: boolean;
  /** 也可直接传入一个地址，若为空则使用钱包地址 / mockAddress */
  address?: string;
}

export interface UseMyRankResult {
  data    : MyRank | null;
  loading : boolean;
  error   : AxiosError | null;
  refetch : () => void;
}

/* ────────────────── Hook 实现 ────────────────── */
export function useMyRank({
  autoFetch = true,
  address: explicitAddress,
}: UseMyRankParams = {}): UseMyRankResult {
  /* ---------- 地址计算 ---------- */
  const wallet          = useWallet();
  const searchParams    = useSearchParams();
  const mockAddress     = searchParams.get('mockAddress');

  const effectiveAddress =
    explicitAddress ??
    (process.env.NODE_ENV !== 'production' && mockAddress
      ? mockAddress
      : wallet.address);

  /* ---------- State ---------- */
  const [data, setData]       = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<AxiosError | null>(null);

  const cancelRef = useRef<CancelTokenSource>();

  /* ---------- 请求函数 ---------- */
  const fetchData = useCallback(async () => {
    if (!effectiveAddress) return;          // 钱包未连接

    setLoading(true);
    setError(null);

    cancelRef.current?.cancel('abort previous');
    const source = axios.CancelToken.source();
    cancelRef.current = source;

    try {
      const res = await http.get<MyRankResponse>(
        '/api/v1/points/page',
        {
          cancelToken: source.token,
          params     : {
            userAddress: effectiveAddress,
            pageIndex : 1,
            pageSize  : 1,          // 只需 1 条
          },
        },
      );

      if (res.data.msg === 'success' && res.data.data.length > 0) {
        setData(res.data.data[0]);
      } else {
        throw new Error(res.data.msg);
      }
    } catch (err) {
      if (!axios.isCancel(err)) setError(err as AxiosError);
    } finally {
      setLoading(false);
    }
  }, [effectiveAddress]);

  /* ---------- 副作用 ---------- */
  useEffect(() => () => cancelRef.current?.cancel('unmount'), []);
  useEffect(() => {
    if (autoFetch && effectiveAddress) fetchData();
  }, [fetchData, autoFetch, effectiveAddress]);

  /* ---------- 返回 ---------- */
  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}