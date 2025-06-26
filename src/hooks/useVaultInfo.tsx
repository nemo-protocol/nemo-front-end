// src/hooks/useVaultInfo.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';

/* =======================================================
 *                    类型定义
 * ======================================================= */
export interface VaultInfoItem {
  apy: string;
  coinType: string;
  deploymentUnix: string;
  fee: string;
  cardShowTagList: Array<string>;
  leftCoinLogo: string;
  leftCoinName: string;
  leftCoinPrice: string;
  leftCoinType: string;
  leftTokenAmount: string;
  maturity: string;
  rightCoinLogo: string;
  rightCoinName: string;
  rightCoinPrice: string;
  rightCoinType: string;
  rightTokenAmount: string;
  sourceProtocol: string;
  sourceProtocolUrl: string;
  tvl: string;
  vaultAddress: string;

  sourceProtocolLogoUrl: string
  vaultName: string;
  vaultOverview: string;
}

export interface VaultInfoData {
  count: number;
  data: VaultInfoItem[];
  page: { pageIndex: number; pageSize: number };
}

export interface VaultInfoResponse {
  count: number;
  data: VaultInfoItem[];
  msg: string;
  page: { pageIndex: number; pageSize: number };
}

/* =======================================================
 *                Hook 入参 / 返回值类型
 * ======================================================= */
export interface UseVaultInfoParams {
  /** 分页大小，默认 10。详情页不需要时可以不传 */
  pageSize?: number;
  /** 页码，默认 1。详情页不需要时可以不传 */
  pageIndex?: number;
  /** 详情页必传 */
  coinType?: string;
  /** 详情页必传 */
  maturity?: string;
  /** 参数变化时是否自动请求，默认 true */
  autoFetch?: boolean;
}

export interface UseVaultInfoResult {
  data: VaultInfoData | null;
  loading: boolean;
  error: AxiosError | null;
  refetch: () => void;

  /* 分页控制：列表页才会用到 */
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

/* =======================================================
 *                        Hook
 * ======================================================= */
export function useVaultInfo(
  {
    pageSize: initSize = 10,
    pageIndex: initIdx = 1,
    coinType,
    maturity,
    autoFetch = true,
  }: UseVaultInfoParams = {},
): UseVaultInfoResult {

  /* ------------------------- 组件状态 ------------------------------ */
  const [data, setData] = useState<VaultInfoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);
  const [pageSize, setPageSize] = useState(initSize);
  const [pageIndex, setPageIndex] = useState(initIdx);

  const cancelRef = useRef<CancelTokenSource>();

  /* --------------------------- 请求函数 --------------------------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 取消前一个请求
    cancelRef.current?.cancel('abort previous');
    const source = axios.CancelToken.source();
    cancelRef.current = source;

    // 组装查询参数：只有在有值时才带上 coinType / maturity
    const params: Record<string, any> = {};
    if (pageSize) params.pageSize = pageSize;
    if (pageIndex) params.pageIndex = pageIndex;
    if (coinType) params.coinType = coinType;
    if (maturity) params.maturity = maturity;

    try {
      const res = await http.get<VaultInfoResponse>(
        'https://dev-api.nemoprotocol.com/api/v1/market/vault/info',
        {
          cancelToken: source.token,
          params,
        },
      );

      const { msg, ...payload } = res.data;
      if (msg === 'success') {
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
  }, [pageSize, pageIndex, coinType, maturity]);

  /* --------------------------- 副作用 ----------------------------- */
  // 组件卸载时取消请求
  useEffect(() => () => cancelRef.current?.cancel('unmount'), []);

  // 依赖变化时自动重新拉取
  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

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