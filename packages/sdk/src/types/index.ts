export interface CoinData {
  balance: string
  coinObjectId: string
}

export interface BaseCoinInfo {
  id: string
  coinLogo: string
  maturity: string
  coinName: string
  coinType: string
  ptTokenType: string
  nemoContractId: string
  boost: string
  provider: string
  providerLogo: string
  cap: string
  marketStateId: string
  syCoinType: string
  underlyingCoinType: string
  providerMarket: string
  providerVersion: string
  priceOracleConfigId: string
  decimal: string
  underlyingApy: string
  coinPrice: string
  underlyingPrice: string
  pyStateId: string
  syStateId: string
  conversionRate: string
  marketFactoryConfigId: string
  swapFeeForLpHolder: string
  underlyingCoinName: string
  underlyingCoinLogo: string
  version: string
  perPoints: string
  oraclePackageId: string
  oracleTicket: string
  oracleVoucherPackageId: string
  yieldTokenType: string
  tokenRegistryState: string
}

export interface CoinConfig extends BaseCoinInfo {
  pyStoreId: string
  pyPosition: string
  pyPositionType: string
  pyPositionTypeList: string[]
  marketPosition: string
  marketPositionType: string
  marketPositionTypeList: string[]
  nemoContractIdList: string[]
  // lpPrice: string
  coinPrice: string
  sevenAvgUnderlyingPtApy: string
  sevenAvgUnderlyingYtApy: string
  sevenAvgUnderlyingApy: string
  underlyingProtocol: string
  underlyingProtocolLogo: string
  swapFeeApy: string
  marketFactoryConfigId: string
  tradeFee: string
  feeRate: string
  yieldFactoryConfigId: string
}

export interface Incentive {
  apy: string
  tokenType: string
  tokenLogo: string
}

export interface PortfolioItem extends CoinConfig {
  underlyingProtocol: string
  yieldFactoryConfigId: string
  pyPositionTypeList: string[]
  marketPositionTypeList: string[]
}

export interface TokenInfo {
  logo: string
  price: string
  decimal: string
  name: string
}

export interface TokenInfoMap {
  [key: string]: TokenInfo
}

export interface CoinInfoWithMetrics extends BaseCoinInfo {
  isFold: string
  tokenType: string
  ptPrice: string
  ytPrice: string
  ptApy: string
  ytApy: string
  tvl: string
  poolApy: string
  ptTvl: string
  syTvl: string
  marketState: MarketState
  scaledApy: string
  underlyingApy: string
  scaledUnderlyingApy: string
  scaledPtApy: string
  incentive: string
  totalApy: string
  feeApy: string
  incentives: Incentive[]
  swapFeeApy: string
  incentiveApy: string
  lpPrice: string
}

export interface MarketState {
  marketCap: string
  totalSy: string
  lpSupply: string
  totalPt: string
  rewardMetrics: {
    tokenType: string
    tokenLogo: string
    dailyEmission: string
    tokenPrice: string
    tokenName?: string
    decimal?: string
  }[]
}
