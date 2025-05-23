import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';
import { TokenType } from '@/queries/types/market';

/* ==========================
 *  类型声明，可根据接口调整
 * ========================== */
export type Granularity = 'YEARLY' | 'MONTHLY' | 'DAILY' | 'HOURLY' | 'MINUTELY';

/** 接口返回结构（示例，可根据实际 response.ApyHistoryCommonResponse 调整） */
export interface ApyHistoryPoint {
    apy: number;          // APY 数值
    price: number;        // 价格
    timeLabel: number;    // 时间戳（秒）
}

export interface ApyHistoryData {
    marketStateId: string;
    tokenType: TokenType;
    granularity: Granularity;
    data: ApyHistoryPoint[];
}
export interface ApyHistoryResponse {
    data: ApyHistoryData
    msg: string
}
/* ==========================
 *        React Hook
 * ========================== */
export interface UseApyHistoryParams {
    marketStateId: string;
    tokenType: TokenType;
    granularity: Granularity;
    /** 开始时间戳（秒）：可选 */
    startTime?: number;
    /** 结束时间戳（秒）：可选 */
    endTime?: number;
    /** 是否在参数变化时自动请求，默认 true */
    autoFetch?: boolean;
}

export interface UseApyHistoryResult {
    data: ApyHistoryData | null;
    loading: boolean;
    error: AxiosError | null;
    /** 手动重新拉取 */
    refetch: () => void;
}

/**
 * 根据时间粒度获取某个市场的 APY & 价格历史走势
 */
export function useApyHistory({
    marketStateId,
    tokenType,
    granularity,
    startTime,
    endTime,
    autoFetch = true,
}: UseApyHistoryParams): UseApyHistoryResult {
    const [data, setData] = useState<ApyHistoryData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<AxiosError | null>(null);

    // 保存 cancel token，组件卸载时取消请求
    const cancelRef = useRef<CancelTokenSource>();

    /** 实际请求函数 */
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        // 取消上一次请求
        cancelRef.current?.cancel('Operation canceled due to new request.');
        const source = axios.CancelToken.source();
        cancelRef.current = source;

        try {
            const res = await http.get<ApyHistoryResponse>('/api/v1/market/apyData/history', {
                cancelToken: source.token,
                params: {
                    marketStateId,
                    tokenType,
                    granularity,
                    startTime,
                    endTime,
                },
            });
            if (res.data.msg == "success" && res.data.data) { setData(res.data.data); }
        } catch (err) {
            if (!axios.isCancel(err)) {
                setError(err as AxiosError);
            }
        } finally {
            setLoading(false);
        }
    }, [marketStateId, tokenType, granularity, startTime, endTime]);

    // 组件卸载时取消请求
    useEffect(() => {
        return () => cancelRef.current?.cancel('Component unmounted.');
    }, []);

    // 自动拉取
    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [fetchData, autoFetch]);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
    };
}
