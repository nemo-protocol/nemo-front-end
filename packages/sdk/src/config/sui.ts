import { getFullnodeUrl } from "@mysten/sui/client"
import { SuiClient } from "@mysten/sui/client"

// 创建主网 SuiClient 实例
export const mainnetClient = new SuiClient({
  url: getFullnodeUrl("mainnet"),
})

// 创建测试网 SuiClient 实例
export const testnetClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
})

// 默认使用主网
export const defaultClient = mainnetClient 