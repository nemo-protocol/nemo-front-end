import * as _tanstack_react_query from '@tanstack/react-query';

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

declare function useQueryConversionRate(coinConfig?: CoinConfig): _tanstack_react_query.UseQueryResult<string | undefined, Error>;

export { useQueryConversionRate };
