// src/hooks/useMarketTransactions.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';
import { useWallet } from '@nemoprotocol/wallet-kit';


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
    { pageSize: initSize = 10, pageIndex: initIdx = 1, autoFetch = true }: UseMarketTransactionsParams = {},
  ): UseMarketTransactionsResult {
    const { address } = useWallet();
  
    const [data, setData]       = useState<MarketTransactionsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<AxiosError | null>(null);
    const [pageSize, setPageSize]   = useState(initSize);
    const [pageIndex, setPageIndex] = useState(initIdx);
  
    const cancelRef = useRef<CancelTokenSource>();
  
    /* -------------------- 请求函数 -------------------- */
    const fetchData = useCallback(async () => {
      /* 如果没有地址可以直接 return，或者改成显示错误 */
      if (!address) return;
  
      setLoading(true);
      setError(null);
  
      cancelRef.current?.cancel('abort previous');
      const source = axios.CancelToken.source();
      cancelRef.current = source;
  
      try {
        const res = await http.get<MarketTransactionsResponse>(
          '/api/v1/market/transactions',
          {
            cancelToken: source.token,
            params : { pageSize, pageIndex },
            headers: { userAddress: address },  
          },
        );
  
        const { msg, ...payload } = res.data;
        if (msg === 'success') {
          setData({
            count: payload.count,
            data : payload.data,
            page : payload.page,
          });
        } else {
          throw new Error(msg);
        }
      } catch (err) {
        if (!axios.isCancel(err)) setError(err as AxiosError);
      } finally {
        setLoading(false);
      }
    }, [pageSize, pageIndex, address]);         
  

    useEffect(() => () => cancelRef.current?.cancel('unmount'), []);
    useEffect(() => { if (autoFetch && address) fetchData(); },
              [fetchData, autoFetch, address]);
  
    return { data, loading, error, refetch: fetchData, setPageSize, setPageIndex };
  }
