import { TransactionArgument, Transaction } from '@mysten/sui/transactions';
import * as _tanstack_react_query from '@tanstack/react-query';

interface MoveCallInfo {
    target: string;
    arguments: {
        name: string;
        value: string | TransactionArgument;
    }[];
    typeArguments: string[];
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

interface InitPyPositionParams<T extends boolean = false> {
    tx: Transaction;
    coinConfig: CoinConfig;
    pyPositions?: {
        id: string;
    }[];
    returnDebugInfo?: T;
}
type InitPyPositionResult<T extends boolean> = T extends true ? [{
    pyPosition: TransactionArgument;
    created: boolean;
}, MoveCallInfo] : {
    pyPosition: TransactionArgument;
    created: boolean;
};
declare const initPyPosition: <T extends boolean = false>({ tx, coinConfig, pyPositions, returnDebugInfo, }: InitPyPositionParams<T>) => InitPyPositionResult<T>;

declare function useQueryConversionRate(coinConfig?: CoinConfig): _tanstack_react_query.UseQueryResult<string | undefined, Error>;

export { initPyPosition, useQueryConversionRate };
