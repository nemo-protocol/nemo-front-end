// src/hooks/useUserVaultInfo.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import http from '@/lib/http';

/* =======================================================
 *                    类型定义
 * ======================================================= */
export type VaultInfo = {
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

    sourceProtocolLogoUrl: string;
    vaultName: string;
    vaultOverview: string;

    /* 新增字段 */
    earnings: string;
}

export interface UserVaultInfoData {
    count: number;
    data: VaultInfo[];
    page: { pageIndex: number; pageSize: number };
}

export interface UserVaultInfoResponse {
    count: number;
    data: VaultInfo[];
    msg: string;
    page: { pageIndex: number; pageSize: number };
}

/* =======================================================
 *                Hook 入参 / 返回值类型
 * ======================================================= */
export interface UseUserVaultInfoParams {
    pageSize?: number;
    pageIndex?: number;
    coinType?: string;
    maturity?: string;
    autoFetch?: boolean;
}

export interface UseUserVaultInfoResult {
    data: UserVaultInfoData | undefined;
    loading: boolean;
    error: AxiosError | undefined;
    refetch: () => void;

    setPageSize: React.Dispatch<React.SetStateAction<number>>;
    setPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

/* =======================================================
 *                        Hook
 * ======================================================= */
export function useUserVaultInfo(
    {
        pageSize: initSize = 100,
        pageIndex: initIdx = 1,
        coinType,
        maturity,
        autoFetch = true,
    }: UseUserVaultInfoParams = {},
): UseUserVaultInfoResult {

    /* ------------------------- 组件状态 ------------------------------ */
    const [data, setData] = useState<UserVaultInfoData | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AxiosError | undefined>(undefined);
    const [pageSize, setPageSize] = useState(initSize);
    const [pageIndex, setPageIndex] = useState(initIdx);

    const cancelRef = useRef<CancelTokenSource>();

    /* --------------------------- 请求函数 --------------------------- */
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(undefined);

        // 取消前一个请求
        cancelRef.current?.cancel('abort previous');
        const source = axios.CancelToken.source();
        cancelRef.current = source;

        // 组装查询参数
        const params: Record<string, any> = {};
        if (pageSize) params.pageSize = pageSize;
        if (pageIndex) params.pageIndex = pageIndex;
        if (coinType) params.coinType = coinType;
        if (maturity) params.maturity = maturity;

        try {
            const res = await http.get<UserVaultInfoResponse>(
                'https://dev-api.nemoprotocol.com/api/v1/market/user/vaultInfo',
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
    useEffect(() => () => cancelRef.current?.cancel('unmount'), []);

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
