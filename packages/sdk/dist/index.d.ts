import { TransactionArgument, Transaction, TransactionResult } from '@mysten/sui/transactions';
import * as _tanstack_react_query from '@tanstack/react-query';
import { UseMutationResult } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { ClassValue } from 'clsx';
import { SuiClient } from '@mysten/sui/client';

interface LoadingState {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
}
declare function useRatioLoadingState(isFetching: boolean): LoadingState;

interface CoinData {
    balance: string;
    coinObjectId: string;
}
interface BaseCoinInfo {
    id: string;
    coinLogo: string;
    maturity: string;
    coinName: string;
    coinType: string;
    ptTokenType: string;
    nemoContractId: string;
    boost: string;
    provider: string;
    providerLogo: string;
    cap: string;
    marketStateId: string;
    syCoinType: string;
    underlyingCoinType: string;
    providerMarket: string;
    providerVersion: string;
    priceOracleConfigId: string;
    decimal: string;
    underlyingApy: string;
    coinPrice: string;
    underlyingPrice: string;
    pyStateId: string;
    syStateId: string;
    conversionRate: string;
    marketFactoryConfigId: string;
    swapFeeForLpHolder: string;
    underlyingCoinName: string;
    underlyingCoinLogo: string;
    version: string;
    perPoints: string;
    oraclePackageId: string;
    oracleTicket: string;
    oracleVoucherPackageId: string;
    yieldTokenType: string;
    tokenRegistryState: string;
}
interface CoinConfig extends BaseCoinInfo {
    pyStoreId: string;
    pyPosition: string;
    pyPositionType: string;
    pyPositionTypeList: string[];
    marketPosition: string;
    marketPositionType: string;
    marketPositionTypeList: string[];
    nemoContractIdList: string[];
    coinPrice: string;
    sevenAvgUnderlyingPtApy: string;
    sevenAvgUnderlyingYtApy: string;
    sevenAvgUnderlyingApy: string;
    underlyingProtocol: string;
    underlyingProtocolLogo: string;
    swapFeeApy: string;
    marketFactoryConfigId: string;
    tradeFee: string;
    feeRate: string;
    yieldFactoryConfigId: string;
}
interface Incentive {
    apy: string;
    tokenType: string;
    tokenLogo: string;
}
interface CoinInfoWithMetrics extends BaseCoinInfo {
    isFold: string;
    tokenType: string;
    ptPrice: string;
    ytPrice: string;
    ptApy: string;
    ytApy: string;
    tvl: string;
    poolApy: string;
    ptTvl: string;
    syTvl: string;
    marketState: MarketState$1;
    scaledApy: string;
    underlyingApy: string;
    scaledUnderlyingApy: string;
    scaledPtApy: string;
    incentive: string;
    totalApy: string;
    feeApy: string;
    incentives: Incentive[];
    swapFeeApy: string;
    incentiveApy: string;
    lpPrice: string;
}
interface MarketState$1 {
    marketCap: string;
    totalSy: string;
    lpSupply: string;
    totalPt: string;
    rewardMetrics: {
        tokenType: string;
        tokenLogo: string;
        dailyEmission: string;
        tokenPrice: string;
        tokenName?: string;
        decimal?: string;
    }[];
}

interface MoveCallInfo {
    target: string;
    arguments: {
        name: string;
        value: string | TransactionArgument;
    }[];
    typeArguments: string[];
}
interface DebugInfo {
    moveCall: MoveCallInfo[];
    rawResult: {
        error?: string | null;
        results?: unknown[] | null;
    };
    parsedOutput?: unknown;
    result?: string;
}
declare class ContractError extends Error {
    debugInfo: DebugInfo;
    constructor(message: string, debugInfo: DebugInfo);
}
interface LpPosition {
    id: {
        id: string;
    };
    description: string;
    expiry: string;
    expiry_days: string;
    lp_amount: string;
    lp_amount_display: string;
    market_state_id: string;
    name: string;
    url: string;
    yield_token: string;
}
interface PyPosition {
    id: string;
    maturity: string;
    ptBalance: string;
    ytBalance: string;
    pyStateId: string;
}
interface RewardMetrics {
    tokenType: string;
    tokenLogo: string;
    tokenName?: string;
    tokenPrice: string;
    dailyEmission: string;
    decimal?: string;
}
interface MarketState {
    marketCap: string;
    totalSy: string;
    lpSupply: string;
    totalPt: string;
    rewardMetrics: {
        tokenType: string;
        tokenLogo: string;
        dailyEmission: string;
        tokenPrice: string;
        tokenName?: string;
        decimal?: string;
    }[];
}

type DryRunResult$4<T extends boolean> = T extends true ? [string, DebugInfo] : string;
declare function useQuerySyOutFromPtInWithVoucher<T extends boolean = false>(coinConfig?: CoinConfig, debug?: T): _tanstack_react_query.UseMutationResult<DryRunResult$4<T>, Error, string, unknown>;

interface YtOutBySyInResult {
    ytValue: string;
    feeValue: string;
    ytAmount: string;
}
type DryRunResult$3<T extends boolean> = T extends true ? [YtOutBySyInResult, DebugInfo] : YtOutBySyInResult;
declare function useQueryYtOutBySyInWithVoucher<T extends boolean = false>(coinConfig?: CoinConfig, debug?: T): _tanstack_react_query.UseMutationResult<DryRunResult$3<T>, Error, string, unknown>;

declare function useQueryPriceVoucher(coinConfig?: CoinConfig, debug?: boolean): _tanstack_react_query.UseMutationResult<string | [string, DebugInfo], Error, void, unknown>;

type Result = {
    ptValue: string;
    ptAmount: string;
    syValue: string;
    syAmount: string;
    tradeFee: string;
};
interface QueryPtOutBySyInParams {
    syAmount: string;
    minPtAmount?: string;
    innerCoinConfig?: CoinConfig;
}
type DryRunResult$2<T extends boolean> = T extends true ? [Result, DebugInfo] : Result;
declare function useQueryPtOutBySyIn<T extends boolean = false>({ outerCoinConfig, debug }?: {
    outerCoinConfig?: CoinConfig;
    debug?: T;
}): _tanstack_react_query.UseMutationResult<DryRunResult$2<T>, Error, QueryPtOutBySyInParams, unknown>;

interface SyOutByYtInResult {
    syValue: string;
    syAmount: string;
}
type DryRunResult$1<T extends boolean> = T extends true ? [SyOutByYtInResult, DebugInfo] : SyOutByYtInResult;
declare function useQuerySyOutByYtInDryRun<T extends boolean = false>({ outerCoinConfig, debug }?: {
    outerCoinConfig?: CoinConfig;
    debug?: T;
}): _tanstack_react_query.UseMutationResult<DryRunResult$1<T>, Error, {
    ytAmount: string;
    innerCoinConfig?: CoinConfig;
}, unknown>;

type BurnLpResult = {
    ptAmount: string;
    syAmount: string;
    ptValue: string;
    syValue: string;
    outputValue: string;
    outputAmount: string;
};
interface BurnLpParams {
    lpAmount: string;
    slippage: string;
    vaultId?: string;
    receivingType?: "underlying" | "sy";
}
declare function useBurnLpDryRun(outerCoinConfig?: CoinConfig, debug?: boolean): _tanstack_react_query.UseMutationResult<[BurnLpResult] | [BurnLpResult, DebugInfo], Error, BurnLpParams, unknown>;

type DryRunResult<T extends boolean> = T extends true ? [LpPosition[], DebugInfo] : LpPosition[];
declare function useFetchLpPosition<T extends boolean = false>(coinConfig?: CoinConfig, debug?: T): _tanstack_react_query.UseMutationResult<DryRunResult<T>, Error, void, unknown>;

interface GetObjectParams {
    objectId: string;
    options?: {
        showContent?: boolean;
        showDisplay?: boolean;
        showType?: boolean;
        showOwner?: boolean;
        showPreviousTransaction?: boolean;
        showBcs?: boolean;
        showStorageRebate?: boolean;
    };
    typeArguments?: string[];
}
interface MintSCoinParams {
    coinData: CoinData[];
    amounts: string[];
}
type QueryInputMap = {
    PT_OUT_BY_SY_IN: string;
    YT_OUT_BY_SY_IN: string;
    LP_OUT_FROM_MINT: {
        ptValue: string;
        syValue: string;
    };
    SY_OUT_BY_YT_IN: string;
    SY_OUT_BY_PT_IN: string;
    PRICE_VOUCHER: void;
    SY_OUT_FROM_BURN_LP: string;
    LP_MARKET_POSITION: void;
    PY_POSITION: void;
    BURN_LP_DRY_RUN: string;
    MINT_SCOIN: MintSCoinParams;
};
declare const QUERY_CONFIGS: {
    readonly PT_OUT_BY_SY_IN: {
        readonly target: "get_pt_out_for_exact_sy_in_with_price_voucher";
        readonly hook: typeof useQueryPtOutBySyIn;
    };
    readonly YT_OUT_BY_SY_IN: {
        readonly target: "get_yt_out_for_exact_sy_in_with_price_voucher";
        readonly hook: typeof useQueryYtOutBySyInWithVoucher;
    };
    readonly SY_OUT_BY_YT_IN: {
        readonly target: "get_sy_amount_out_for_exact_yt_in_with_price_voucher";
        readonly hook: typeof useQuerySyOutByYtInDryRun;
    };
    readonly SY_OUT_BY_PT_IN: {
        readonly target: "get_sy_amount_out_for_exact_pt_in_with_price_voucher";
        readonly hook: typeof useQuerySyOutFromPtInWithVoucher;
    };
    readonly PRICE_VOUCHER: {
        readonly target: "get_price_voucher";
        readonly hook: typeof useQueryPriceVoucher;
    };
    readonly SY_OUT_FROM_BURN_LP: {
        readonly target: "burn_lp";
        readonly hook: typeof useBurnLpDryRun;
    };
    readonly LP_MARKET_POSITION: {
        readonly target: "get_lp_market_position";
        readonly hook: typeof useFetchLpPosition;
    };
    readonly PY_POSITION: {
        readonly target: "get_py_position";
        readonly hook: (coinConfig?: CoinConfig, debug?: boolean) => UseMutationResult<(DebugInfo | PyPosition[])[], Error, void, unknown>;
    };
    readonly BURN_LP_DRY_RUN: {
        readonly target: "burn_lp_dry_run";
        readonly hook: typeof useBurnLpDryRun;
    };
};

interface PoolMetricsResult {
    ptApy: string;
    ytApy: string;
    incentiveApy: string;
    scaledUnderlyingApy: string;
    scaledPtApy: string;
    tvl: string;
    ptTvl: string;
    syTvl: string;
    ptPrice: string;
    ytPrice: string;
    poolApy: string;
    swapFeeApy: string;
    lpPrice: string;
    marketState: MarketState;
    incentives: Incentive[];
}

declare function useCalculatePtYt(coinInfo?: CoinConfig | CoinInfoWithMetrics, marketState?: MarketState): _tanstack_react_query.UseQueryResult<PoolMetricsResult, Error>;

declare function splitCoinHelper(tx: Transaction, coinData: CoinData[], amounts: string[], coinType?: string): {
    $kind: "Input";
    Input: number;
    type?: "object";
}[] | ({
    $kind: "Result";
    Result: number;
} & {
    $kind: "NestedResult";
    NestedResult: [number, number];
}[]);
declare const mergeLpPositions: (tx: Transaction, coinConfig: CoinConfig, lpPositions: LpPosition[], lpAmount: string) => {
    $kind: "Input";
    Input: number;
    type?: "object";
};
declare function depositSyCoin(tx: Transaction, coinConfig: CoinConfig, splitCoin: TransactionArgument, coinType: string): {
    $kind: "NestedResult";
    NestedResult: [number, number];
};
declare const mintPY: <T extends boolean = false>(tx: Transaction, coinConfig: CoinConfig, syCoin: TransactionArgument, priceVoucher: TransactionArgument, pyPosition: TransactionArgument, returnDebugInfo?: T) => T extends true ? [TransactionResult, MoveCallInfo] : TransactionResult;
declare const redeemSyCoin: (tx: Transaction, coinConfig: CoinConfig, syCoin: TransactionArgument) => {
    $kind: "NestedResult";
    NestedResult: [number, number];
};
declare const burnLp: (tx: Transaction, coinConfig: CoinConfig, lpAmount: string, pyPosition: TransactionArgument, mergedPositionId: TransactionArgument) => {
    $kind: "NestedResult";
    NestedResult: [number, number];
};
declare const swapExactPtForSy: <T extends boolean = false>(tx: Transaction, coinConfig: CoinConfig, ptAmount: string, pyPosition: TransactionArgument, priceVoucher: TransactionArgument, minSyOut: string, returnDebugInfo?: T) => T extends true ? [TransactionResult, MoveCallInfo] : TransactionResult;
declare const swapExactYtForSy: <T extends boolean = false>(tx: Transaction, coinConfig: CoinConfig, ytAmount: string, pyPosition: TransactionArgument, priceVoucher: TransactionArgument, minSyOut: string, returnDebugInfo?: T) => T extends true ? [TransactionResult, MoveCallInfo] : TransactionResult;
declare const redeemPy: <T extends boolean = false>(tx: Transaction, coinConfig: CoinConfig, ytAmount: string, ptAmount: string, priceVoucher: TransactionArgument, pyPosition: TransactionArgument, returnDebugInfo?: T) => T extends true ? [TransactionResult, MoveCallInfo] : TransactionResult;
declare const getPrice: (tx: Transaction, coinConfig: CoinConfig, priceVoucher: TransactionArgument) => {
    $kind: "NestedResult";
    NestedResult: [number, number];
};
declare const mergeAllLpPositions: (tx: Transaction, coinConfig: CoinConfig, lpPositions: LpPosition[], marketPosition: TransactionArgument) => TransactionArgument;
declare const swapExactSyForPt: <T extends boolean = false>(tx: Transaction, coinConfig: CoinConfig, syCoin: TransactionArgument, priceVoucher: TransactionArgument, pyPosition: TransactionArgument, minPtOut: string, approxPtOut: string, returnDebugInfo?: T) => T extends true ? MoveCallInfo : void;
declare const mergeAllCoins: (tx: Transaction, address: string, coins: CoinData[], coinType?: string) => Promise<string>;

declare function cn(...inputs: ClassValue[]): string;
declare const truncateStr: (str: string, charsPerSide?: number) => string;
declare const debounce: <T extends (...args: Parameters<T>) => ReturnType<T>>(func: T, delay: number) => T & {
    cancel: () => void;
};
/**
 * Formats a number with optional decimal places and unit suffixes
 * @param value The number to format
 * @param decimal Number of decimal places (default: 2)
 * @returns Formatted string
 */
declare const formatDecimalValue: (_value?: string | number | Decimal, decimal?: number) => string;
declare const splitSyAmount: (syAmount: string, lpSupply: string, totalSy: string, totalPt: string, exchangeRate: string, pyIndexStored: string) => {
    syForPtValue: string;
    syValue: string;
    ptValue: string;
};
declare function get_pt_out(syAmount: number, exchange_rate: number, py_index_stored: number): number;
/**
 * Recursively handles +Inf/-Inf values in an object, converting them to empty strings
 * @param data The data object to process
 * @returns Processed data with Infinity values converted to empty strings
 */
declare function handleInfinityValues<T>(data: T): T;
/**
 * Checks if a string amount is valid (not empty, not "0", and is a valid number)
 * @param amount The amount string to check
 * @returns boolean indicating if the amount is valid
 */
declare const isValidAmount: (amount?: string | number | Decimal | null) => boolean;
/**
 * Formats time difference to display string
 * @param timestamp Unix timestamp to compare with current time
 * @returns Formatted string like "5 DAYS", "3 HOURS", "2 MINS", "30 SECS" or "END"
 */
declare const formatTimeDiff: (timestamp: number) => string;
type DivideReturnType<T> = T extends "string" ? string : T extends "number" ? number : Decimal;
declare const safeDivide: <T extends "string" | "number" | "decimal">(numerator?: string | number | Decimal, denominator?: string | number | Decimal, returnType?: T) => DivideReturnType<T>;
/**
 * Formats a number to a human readable string with K, M, B, T suffixes
 * @param value The number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted string like "1.23K" or "1.23M"
 */
declare const formatLargeNumber: (value?: string | number | Decimal, decimals?: number) => string;
declare const formatTVL: (tvlStr: string) => string;
declare function formatPortfolioNumber(input: string | number | Decimal): string;

declare const parseErrorMessage: (errorString: string) => {
    error: string;
    detail: string;
};
declare function parseGasErrorMessage(msg: string): string | undefined;

/**
 * Fetches coin data for a specific address and coin type
 * @param client SuiClient instance
 * @param address The address to fetch coins for
 * @param coinType The type of coin to fetch
 * @returns Sorted array of CoinData objects
 */
declare function fetchCoins(client: SuiClient, address: string, coinType: string): Promise<CoinData[]>;

declare const SCALLOP: {
    readonly MARKET_OBJECT: "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9";
    readonly VERSION_OBJECT: "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7";
    readonly S_COIN: readonly [{
        readonly coinType: "0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI";
        readonly treasury: "0x5c1678c8261ac9eec024d4d630006a9f55c80dc0b1aa38a003fcb1d425818c6b";
    }, {
        readonly coinType: "0xea346ce428f91ab007210443efcea5f5cdbbb3aae7e9affc0ca93f9203c31f0c::scallop_cetus::SCALLOP_CETUS";
        readonly treasury: "0xa283c63488773c916cb3d6c64109536160d5eb496caddc721eb39aad2977d735";
    }, {
        readonly coinType: "0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA";
        readonly treasury: "0xe04bfc95e00252bd654ee13c08edef9ac5e4b6ae4074e8390db39e9a0109c529";
    }, {
        readonly coinType: "0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC";
        readonly treasury: "0x50c5cfcbcca3aaacab0984e4d7ad9a6ad034265bebb440f0d1cd688ec20b2548";
    }, {
        readonly coinType: "0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT";
        readonly treasury: "0x1f02e2fed702b477732d4ad6044aaed04f2e8e586a169153694861a901379df0";
    }, {
        readonly coinType: "0x67540ceb850d418679e69f1fb6b2093d6df78a2a699ffc733f7646096d552e9b::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH";
        readonly treasury: "0x4b7f5da0e306c9d52490a0c1d4091e653d6b89778b9b4f23c877e534e4d9cd21";
    }, {
        readonly coinType: "0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI";
        readonly treasury: "0x55f4dfe9e40bc4cc11c70fcb1f3daefa2bdc330567c58d4f0792fbd9f9175a62";
    }, {
        readonly coinType: "0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI";
        readonly treasury: "0x404ccc1404d74a90eb6f9c9d4b6cda6d417fb03189f80d9070a35e5dab1df0f5";
    }, {
        readonly coinType: "0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI";
        readonly treasury: "0xc06688ee1af25abc286ffb1d18ce273d1d5907cd1064c25f4e8ca61ea989c1d1";
    }, {
        readonly coinType: "0x1392650f2eca9e3f6ffae3ff89e42a3590d7102b80e2b430f674730bc30d3259::scallop_wormhole_sol::SCALLOP_WORMHOLE_SOL";
        readonly treasury: "0x760fd66f5be869af4382fa32b812b3c67f0eca1bb1ed7a5578b21d56e1848819";
    }, {
        readonly coinType: "0x2cf76a9cf5d3337961d1154283234f94da2dcff18544dfe5cbdef65f319591b5::scallop_wormhole_btc::SCALLOP_WORMHOLE_BTC";
        readonly treasury: "0xe2883934ea42c99bc998bbe0f01dd6d27aa0e27a56455707b1b34e6a41c20baa";
    }, {
        readonly coinType: "0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC";
        readonly treasury: "0xbe6b63021f3d82e0e7e977cdd718ed7c019cf2eba374b7b546220402452f938e";
    }, {
        readonly coinType: "0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH";
        readonly treasury: "0xfd0f02def6358a1f266acfa1493d4707ee8387460d434fb667d63d755ff907ed";
    }, {
        readonly coinType: "0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD";
        readonly treasury: "0xdad9bc6293e694f67a5274ea51b596e0bdabfafc585ae6d7e82888e65f1a03e0";
    }, {
        readonly coinType: "0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP";
        readonly treasury: "0xc63838fabe37b25ad897392d89876d920f5e0c6a406bf3abcb84753d2829bc88";
    }, {
        readonly coinType: "0xe56d5167f427cbe597da9e8150ef5c337839aaf46891d62468dcf80bdd8e10d1::scallop_fud::SCALLOP_FUD";
        readonly treasury: "0xf25212f11d182decff7a86165699a73e3d5787aced203ca539f43cfbc10db867";
    }, {
        readonly coinType: "0xb1d7df34829d1513b73ba17cb7ad90c88d1e104bb65ab8f62f13e0cc103783d3::scallop_sb_usdt::SCALLOP_SB_USDT";
        readonly treasury: "0x58bdf6a9752e3a60144d0b70e8608d630dfd971513e2b2bfa7282f5eaa7d04d8";
    }, {
        readonly coinType: "0xd285cbbf54c87fd93cd15227547467bb3e405da8bbf2ab99f83f323f88ac9a65::scallop_usdy::SCALLOP_USDY";
        readonly treasury: "0xc8c5339fb10d9ad96f235fb312bda54df351549a3302e7fa7fd5d1725481604f";
    }, {
        readonly coinType: "0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD";
        readonly treasury: "0xdad9bc6293e694f67a5274ea51b596e0bdabfafc585ae6d7e82888e65f1a03e0";
    }, {
        readonly coinType: "0x0a228d1c59071eccf3716076a1f71216846ee256d9fb07ea11fb7c1eb56435a5::scallop_musd::SCALLOP_MUSD";
        readonly treasury: "0xadfd554635ccc87e992f23ca838f0f16c14874e324a1b79b77f6bfe118edea9f";
    }, {
        readonly coinType: "0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI";
        readonly treasury: "0x404ccc1404d74a90eb6f9c9d4b6cda6d417fb03189f80d9070a35e5dab1df0f5";
    }, {
        readonly coinType: "0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI";
        readonly treasury: "0x55f4dfe9e40bc4cc11c70fcb1f3daefa2bdc330567c58d4f0792fbd9f9175a62";
    }, {
        readonly coinType: "0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI";
        readonly treasury: "0xc06688ee1af25abc286ffb1d18ce273d1d5907cd1064c25f4e8ca61ea989c1d1";
    }, {
        readonly coinType: "0x622345b3f80ea5947567760eec7b9639d0582adcfd6ab9fccb85437aeda7c0d0::scallop_wal::SCALLOP_WAL";
        readonly treasury: "0xc02b365a1d880156c1a757d7777867e8a436ab97ce5f51e211695580ab7c9bce";
    }, {
        readonly coinType: "0x0425be5f46f5639ab7201dfde3b2ed837fc129c434f55677c9ba11b528a3214a::scallop_haedal::SCALLOP_HAEDAL";
        readonly treasury: "0x4ae9417c4c2ae8e629e72d06682f248c90c61233d43eb0a5654de768d63be26d";
    }];
};
declare const VALIDATORS: {
    readonly MYSTEN_2: "0xcb7efe4253a0fe58df608d8a2d3c0eea94b4b40a8738c8daae4eb77830c16cd7";
    readonly MYSTEN_1: "0x4fffd0005522be4bc029724c7f0f6ed7093a6bf3a09b90e62f61dc15181e1a3e";
};
declare const AFTERMATH: {
    readonly STAKED_SUI_VAULT: "0x2f8f6d5da7f13ea37daa397724280483ed062769813b6f31e9788e59cc88994d";
    readonly SAFE: "0xeb685899830dd5837b47007809c76d91a098d52aabbf61e8ac467c59e5cc4610";
    readonly REFERRAL_VAULT: "0x4ce9a19b594599536c53edb25d22532f82f18038dc8ef618afd00fbbfb9845ef";
    readonly SYSTEM_STATE: "0x5";
    readonly CLOCK: "0x6";
    readonly TREASURY: "0xd2b95022244757b0ab9f74e2ee2fb2c3bf29dce5590fa6993a85d64bd219d7e8";
    readonly VALIDATOR_CONFIGS_TABLE: "0x8536350cfb8a8efdd133a1e087b55416d431f7e8b894f77b55b20c4b799ebad9";
};
declare function getTreasury(coinType: string): "0x5c1678c8261ac9eec024d4d630006a9f55c80dc0b1aa38a003fcb1d425818c6b" | "0xa283c63488773c916cb3d6c64109536160d5eb496caddc721eb39aad2977d735" | "0xe04bfc95e00252bd654ee13c08edef9ac5e4b6ae4074e8390db39e9a0109c529" | "0x50c5cfcbcca3aaacab0984e4d7ad9a6ad034265bebb440f0d1cd688ec20b2548" | "0x1f02e2fed702b477732d4ad6044aaed04f2e8e586a169153694861a901379df0" | "0x4b7f5da0e306c9d52490a0c1d4091e653d6b89778b9b4f23c877e534e4d9cd21" | "0x55f4dfe9e40bc4cc11c70fcb1f3daefa2bdc330567c58d4f0792fbd9f9175a62" | "0x404ccc1404d74a90eb6f9c9d4b6cda6d417fb03189f80d9070a35e5dab1df0f5" | "0xc06688ee1af25abc286ffb1d18ce273d1d5907cd1064c25f4e8ca61ea989c1d1" | "0x760fd66f5be869af4382fa32b812b3c67f0eca1bb1ed7a5578b21d56e1848819" | "0xe2883934ea42c99bc998bbe0f01dd6d27aa0e27a56455707b1b34e6a41c20baa" | "0xbe6b63021f3d82e0e7e977cdd718ed7c019cf2eba374b7b546220402452f938e" | "0xfd0f02def6358a1f266acfa1493d4707ee8387460d434fb667d63d755ff907ed" | "0xdad9bc6293e694f67a5274ea51b596e0bdabfafc585ae6d7e82888e65f1a03e0" | "0xc63838fabe37b25ad897392d89876d920f5e0c6a406bf3abcb84753d2829bc88" | "0xf25212f11d182decff7a86165699a73e3d5787aced203ca539f43cfbc10db867" | "0x58bdf6a9752e3a60144d0b70e8608d630dfd971513e2b2bfa7282f5eaa7d04d8" | "0xc8c5339fb10d9ad96f235fb312bda54df351549a3302e7fa7fd5d1725481604f" | "0xadfd554635ccc87e992f23ca838f0f16c14874e324a1b79b77f6bfe118edea9f" | "0xc02b365a1d880156c1a757d7777867e8a436ab97ce5f51e211695580ab7c9bce" | "0x4ae9417c4c2ae8e629e72d06682f248c90c61233d43eb0a5654de768d63be26d";
declare const DEFAULT_Address = "0x0000000000000000000000000000000000000000000000000000000000000001";
declare const SSBUCK: {
    readonly VAULT: "0xe83e455a9e99884c086c8c79c13367e7a865de1f953e75bcf3e529cdf03c6224";
};
declare const Time: {
    readonly CONVERSION_RATE_REFRESH_INTERVAL: number;
};
declare const ALPAHFI: {
    readonly PACKAGE_ID: "0x059f94b85c07eb74d2847f8255d8cc0a67c9a8dcc039eabf9f8b9e23a0de2700";
    readonly LIQUID_STAKING_INFO: "0x1adb343ab351458e151bc392fbf1558b3332467f23bda45ae67cd355a57fd5f5";
};
declare const SPRING_SUI_STAKING_INFO_LIST: {
    coinType: string;
    value: string;
}[];
declare const HAEDAL: {
    readonly HAEDAL_STAKING_ID: "0x47b224762220393057ebf4f70501b6e657c3e56684737568439a04f80849b2ca";
};
declare const NEED_MIN_VALUE_LIST: ({
    provider: string;
    minValue: number;
    coinType?: undefined;
} | {
    coinType: string;
    minValue: number;
    provider?: undefined;
})[];
declare const VOLO: {
    readonly NATIVE_POOL: "0x7fa2faa111b8c65bea48a23049bfd81ca8f971a262d981dcd9a17c3825cb5baf";
    readonly METADATA: "0x680cd26af32b2bde8d3361e804c53ec1d1cfe24c7f039eb7f549e8dfde389a60";
};
declare const WINTER: {
    readonly WALRUS_STAKING: "0x10b9d30c28448939ce6c4d6c6e0ffce4a7f8a4ada8248bdad09ef8b70e4a3904";
};
declare const Winter_Blizzard_Staking_List: {
    coinType: string;
    value: string;
}[];
declare const SUPER_SUI: {
    readonly REGISTRY: "0x5ff2396592a20f7bf6ff291963948d6fc2abec279e11f50ee74d193c4cf0bba8";
    readonly VAULT: "0x3062285974a5e517c88cf3395923aac788dce74f3640029a01e25d76c4e76f5d";
};
declare const WWAL: {
    readonly PACKAGE_ID: "0x0c2e5a60b4c6e2eda7a5add1f9340160bfcc0559749af239622e8d107d51b431";
    readonly TREASURY_CAP: "0x6d7da14a09687a3ed3e97deb3bc2428ab7f2db39f4e706dd7344760b5ae43729";
    readonly WALRUS_STAKING: "0x10b9d30c28448939ce6c4d6c6e0ffce4a7f8a4ada8248bdad09ef8b70e4a3904";
};
declare const UNSUPPORTED_UNDERLYING_COINS: string[];
declare const CETUS_VAULT_ID_LIST: {
    coinType: string;
    vaultId: string;
}[];

export { AFTERMATH, ALPAHFI, CETUS_VAULT_ID_LIST, ContractError, DEFAULT_Address, type DebugInfo, type GetObjectParams, HAEDAL, type LpPosition, type MarketState, type MintSCoinParams, type MoveCallInfo, NEED_MIN_VALUE_LIST, type PyPosition, QUERY_CONFIGS, type QueryInputMap, type RewardMetrics, SCALLOP, SPRING_SUI_STAKING_INFO_LIST, SSBUCK, SUPER_SUI, Time, UNSUPPORTED_UNDERLYING_COINS, VALIDATORS, VOLO, WINTER, WWAL, Winter_Blizzard_Staking_List, burnLp, cn, debounce, depositSyCoin, fetchCoins, formatDecimalValue, formatLargeNumber, formatPortfolioNumber, formatTVL, formatTimeDiff, getPrice, getTreasury, get_pt_out, handleInfinityValues, isValidAmount, mergeAllCoins, mergeAllLpPositions, mergeLpPositions, mintPY, parseErrorMessage, parseGasErrorMessage, redeemPy, redeemSyCoin, safeDivide, splitCoinHelper, splitSyAmount, swapExactPtForSy, swapExactSyForPt, swapExactYtForSy, truncateStr, useCalculatePtYt, useRatioLoadingState };
