import { debugLog } from "@/config"
import { MoveCallInfo } from "@/hooks/types"
import { BaseCoinInfo } from "@/queries/types/market"
import { Transaction, TransactionArgument } from "@mysten/sui/transactions"
import {
  VOLO,
  SSBUCK,
  HAEDAL,
  ALPAHFI,
  AFTERMATH,
  SUPER_SUI,
  WWAL,
  SPRING_SUI_STAKING_INFO_LIST,
  Winter_Blizzard_Staking_List,
} from "../constants"

// FIXME: catch error and return moveCall
export const getPriceVoucher = <T extends boolean = true>(
  tx: Transaction,
  coinConfig: BaseCoinInfo,
  caller: string = "default",
  returnDebugInfo: T = true as T,
): T extends true
  ? [TransactionArgument, MoveCallInfo]
  : TransactionArgument => {
  let moveCall: MoveCallInfo
  if (coinConfig.provider === "SpringSui") {
    const lstInfo = SPRING_SUI_STAKING_INFO_LIST.find(
      (item) => item.coinType === coinConfig.coinType,
    )?.value

    if (!lstInfo) {
      throw new Error(`SpringSui: lstInfo not found for ${coinConfig.coinType}`)
    }
    moveCall = {
      target: `${coinConfig.oraclePackageId}::spring::get_price_voucher_from_spring`,
      arguments: [
        {
          name: "price_oracle_config",
          value: coinConfig.priceOracleConfigId,
        },
        {
          name: "price_ticket_cap",
          value: coinConfig.oracleTicket,
        },
        { name: "lst_info", value: lstInfo },
        { name: "sy_state", value: coinConfig.syStateId },
      ],
      typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
    }
    if (!returnDebugInfo) {
      debugLog(`[${caller}] get_price_voucher_from_spring move call:`, moveCall)
    }
    const [priceVoucher] = tx.moveCall({
      target: moveCall.target,
      arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
      typeArguments: moveCall.typeArguments,
    })
    return (returnDebugInfo
      ? [priceVoucher, moveCall]
      : priceVoucher) as unknown as T extends true
      ? [TransactionArgument, MoveCallInfo]
      : TransactionArgument
  } else if (coinConfig.provider === "Winter") {
    const blizzardStaking = Winter_Blizzard_Staking_List.find(
      (item) => item.coinType === coinConfig.coinType,
    )?.value

    if (!blizzardStaking) {
      throw new Error("Winter blizzard staking not found")
    }
    moveCall = {
      target: `${coinConfig.oraclePackageId}::haedal::get_price_voucher_from_blizzard`,
      arguments: [
        {
          name: "price_oracle_config",
          value: coinConfig.priceOracleConfigId,
        },
        {
          name: "price_ticket_cap",
          value: coinConfig.oracleTicket,
        },
        {
          name: "blizzard_staking",
          value: blizzardStaking,
        },
        {
          name: "walrus_staking",
          value: WWAL.WALRUS_STAKING,
        },
        { name: "sy_state", value: coinConfig.syStateId },
      ],
      typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
    }
    if (!returnDebugInfo) {
      debugLog(
        `[${caller}] get_price_voucher_from_blizzard move call:`,
        moveCall,
      )
    }
    const [priceVoucher] = tx.moveCall({
      target: moveCall.target,
      arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
      typeArguments: moveCall.typeArguments,
    })
    return (returnDebugInfo
      ? [priceVoucher, moveCall]
      : priceVoucher) as unknown as T extends true
      ? [TransactionArgument, MoveCallInfo]
      : TransactionArgument
  }
  switch (coinConfig.coinType) {
    case "0x8b4d553839b219c3fd47608a0cc3d5fcc572cb25d41b7df3833208586a8d2470::hawal::HAWAL": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::haedal::get_haWAL_price_voucher`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "staking",
            value:
              "0x9e5f6537be1a5b658ec7eed23160df0b28c799563f6c41e9becc9ad633cb592b",
          },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
      }
      if (!returnDebugInfo) {
        debugLog(`[${caller}] get_haWAL_price_voucher move call:`, moveCall)
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0x828b452d2aa239d48e4120c24f4a59f451b8cd8ac76706129f4ac3bd78ac8809::lp_token::LP_TOKEN": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::haedal::get_price_voucher_from_cetus_vault`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "staking",
            value: HAEDAL.HAEDAL_STAKING_ID,
          },
          {
            name: "vault",
            value:
              "0xde97452e63505df696440f86f0b805263d8659b77b8c316739106009d514c270",
          },
          {
            name: "pool",
            value:
              "0x871d8a227114f375170f149f7e9d45be822dd003eba225e83c05ac80828596bc",
          },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [
          coinConfig.syCoinType,
          coinConfig.yieldTokenType, // Use underlyingCoinType as YieldToken
          coinConfig.coinType,
        ],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_cetus_vault move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0xd01d27939064d79e4ae1179cd11cfeeff23943f32b1a842ea1a1e15a0045d77d::st_sbuck::ST_SBUCK": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::buck::get_price_voucher_from_ssbuck`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "vault",
            value: SSBUCK.VAULT,
          },
          { name: "clock", value: "0x6" },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_ssbuck move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::volo::get_price_voucher_from_volo`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          { name: "native_pool", value: VOLO.NATIVE_POOL },
          { name: "metadata", value: VOLO.METADATA },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [coinConfig.syCoinType],
      }
      if (!returnDebugInfo) {
        debugLog(`[${caller}] get_price_voucher_from_volo move call:`, moveCall)
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0x790f258062909e3a0ffc78b3c53ac2f62d7084c3bab95644bdeb05add7250001::super_sui::SUPER_SUI": {
      moveCall = {
        target: `0x83949cdb90510f02ed3aee7a686cd0b1390de073afcadad9aa41d3016eb13463::aftermath::get_meta_coin_price_voucher`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          { name: "registry", value: SUPER_SUI.REGISTRY },
          { name: "vault", value: SUPER_SUI.VAULT },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
      }
      if (!returnDebugInfo) {
        debugLog(`[${caller}] get_meta_coin_price_voucher move call:`, moveCall)
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::aftermath::get_price_voucher_from_aftermath`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "aftermath_staked_sui_vault",
            value: AFTERMATH.STAKED_SUI_VAULT,
          },
          { name: "aftermath_safe", value: AFTERMATH.SAFE },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_spring move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::haedal::get_price_voucher_from_haSui`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          { name: "haedal_staking", value: HAEDAL.HAEDAL_STAKING_ID },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_spring move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::alphafi::get_price_voucher_from_spring`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "lst_info",
            value: ALPAHFI.LIQUID_STAKING_INFO,
          },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.coinType],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_spring move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0x0c8a5fcbe32b9fc88fe1d758d33dd32586143998f68656f43f3a6ced95ea4dc3::lp_token::LP_TOKEN": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::aftermath::get_price_voucher_from_cetus_vault`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "stake_vault",
            value: AFTERMATH.STAKED_SUI_VAULT,
          },
          {
            name: "safe",
            value: AFTERMATH.SAFE,
          },
          {
            name: "vault",
            value:
              "0xff4cc0af0ad9d50d4a3264dfaafd534437d8b66c8ebe9f92b4c39d898d6870a3",
          },
          {
            name: "pool",
            value:
              "0xa528b26eae41bcfca488a9feaa3dca614b2a1d9b9b5c78c256918ced051d4c50",
          },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [
          coinConfig.syCoinType,
          coinConfig.yieldTokenType,
          coinConfig.coinType,
        ],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_cetus_vault move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    case "0xb490d6fa9ead588a9d72da07a02914da42f6b5b1339b8118a90011a42b67a44f::lp_token::LP_TOKEN": {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::volo::get_price_voucher_from_cetus_vault`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          {
            name: "native_pool",
            value: VOLO.NATIVE_POOL,
          },
          {
            name: "metadata",
            value: VOLO.METADATA,
          },
          {
            name: "vault",
            value:
              "0x5732b81e659bd2db47a5b55755743dde15be99490a39717abc80d62ec812bcb6",
          },
          {
            name: "pool",
            value:
              "0x6c545e78638c8c1db7a48b282bb8ca79da107993fcb185f75cedc1f5adb2f535",
          },
          { name: "sy_state", value: coinConfig.syStateId },
        ],
        typeArguments: [
          coinConfig.syCoinType,
          coinConfig.yieldTokenType,
          coinConfig.coinType,
        ],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_cetus_vault move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
    default: {
      moveCall = {
        target: `${coinConfig.oraclePackageId}::scallop::get_price_voucher_from_x_oracle`,
        arguments: [
          {
            name: "price_oracle_config",
            value: coinConfig.priceOracleConfigId,
          },
          {
            name: "price_ticket_cap",
            value: coinConfig.oracleTicket,
          },
          { name: "provider_version", value: coinConfig.providerVersion },
          { name: "provider_market", value: coinConfig.providerMarket },
          { name: "sy_state", value: coinConfig.syStateId },
          { name: "clock", value: "0x6" },
        ],
        typeArguments: [coinConfig.syCoinType, coinConfig.underlyingCoinType],
      }
      if (!returnDebugInfo) {
        debugLog(
          `[${caller}] get_price_voucher_from_x_oracle move call:`,
          moveCall,
        )
      }
      const [priceVoucher] = tx.moveCall({
        target: moveCall.target,
        arguments: moveCall.arguments.map((arg) => tx.object(arg.value)),
        typeArguments: moveCall.typeArguments,
      })
      return (returnDebugInfo
        ? [priceVoucher, moveCall]
        : priceVoucher) as unknown as T extends true
        ? [TransactionArgument, MoveCallInfo]
        : TransactionArgument
    }
  }
}
