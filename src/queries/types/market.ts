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

// FIXME: optimize this
export interface BaseCoinInfo {
  id: string
  tvl: string
  tvlRateChange: string
  coinLogo: string
  maturity: string
  startTime: string
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
  ptPrice: string
  ptTvl: string
  syTvl: string
  marketState: MarketState
  scaledPtApy: string
  scaledUnderlyingApy: string
  feeApy: string
  sevenAvgUnderlyingApy: string
  sevenAvgUnderlyingApyRateChange: string
  ytPrice: string
}

export interface Incentive {
  apy: string
  tokenType: string
  tokenLogo: string
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
  marketState: MarketState
  scaledApy: string
  underlyingApy: string
  incentive: string
  totalApy: string
  incentives: Incentive[]
  swapFeeApy: string
  incentiveApy: string
  lpPrice: string
  groupName: string
  groupLogo: string
}

interface BuiltOn {
  name: string
  logo: string
  url: string
}

export interface CoinConfig extends BaseCoinInfo {
  marketAddress: string | null | undefined
  ptAddress: string | null | undefined
  ytAddress: string | null | undefined
  assetAddress: string | null | undefined
  marketIntro: string
  PtAddress: string | null | undefined
  poolApyRateChange: string
  poolApy: string
  yieldApyRateChange: string
  yieldApy: string
  fixedApyRateChange: string
  fixedApy: string
  volume: string
  volumeRateChange: string
  liquidity: string
  liquidityRateChange: string
  pyStoreId: string
  pyPosition: string
  pyPositionType: string
  pyPositionTypeList: string[]
  marketPosition: string
  marketPositionType: string
  marketPositionTypeList: string[]
  nemoContractIdList: string[]
  lpPrice: string
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
  builtOn?: BuiltOn[]
  tradeStatus: string
  ptTokenLogo: string
  ytTokenLogo: string
  lpTokenLogo: string
  lpPriceRateChange: string
  ptPriceRateChange: string
  ytPriceRateChange: string
}

export interface PortfolioItem extends CoinConfig {
  lpPrice: string
  ytPrice: string
  ytTokenLogo: string
  ptTokenLogo: string
  lpTokenLogo: string
  ytReward: string
  underlyingProtocol: string
  yieldFactoryConfigId: string
  pyPositionTypeList: string[]
  marketPositionTypeList: string[]
}

export interface FixedReturnItem {
  name: string
  youPay: string
  expiry: string
  redeem: string
  fixedReturn: string
  fixedApy: string
  coinLogo: string
  coinType: string
  maturity: string
}

export interface PointItem {
  rank: string
  address: string
  pointsPerDay: string
  totalPoints: string
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

export type Granularity = "YEARLY" | "MONTHLY" | "DAILY" | "HOURLY" | "MINUTELY"

export interface ApyHistoryPoint {
  apy: number
  price: number
  timeLabel: number
}

export interface ApyHistoryData {
  marketStateId: string
  tokenType: TokenType
  granularity: Granularity
  data: ApyHistoryPoint[]
}

export interface ApyHistoryResponse {
  data: ApyHistoryData
  msg: string
}

export type Action = "mint" | "trade" | "provide" | "redeem"

export type TokenType = "FIXED" | "YIELD" | "POOL" | "TVL"
