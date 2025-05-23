import {
  Transaction,
  TransactionResult,
  TransactionArgument,
} from "@mysten/sui/transactions"
import { MoveCallInfo } from "@/hooks/types"
import { CoinConfig } from "@/types"

interface GetPtOutForExactSyInParams<T extends boolean = false> {
  tx: Transaction
  coinConfig: CoinConfig
  syAmount: string
  minPtAmount: string
  priceVoucher: TransactionArgument
  returnDebugInfo?: T
}

export const getPtOutForExactSyIn = <T extends boolean = false>({
  tx,
  coinConfig,
  syAmount,
  minPtAmount,
  priceVoucher,
  returnDebugInfo,
}: GetPtOutForExactSyInParams<T>): T extends true
  ? [TransactionResult, MoveCallInfo]
  : TransactionResult => {
  const moveCallInfo: MoveCallInfo = {
    target: `${coinConfig.nemoContractId}::router::get_pt_out_for_exact_sy_in_with_price_voucher`,
    arguments: [
      { name: "net_sy_in", value: syAmount },
      { name: "min_pt_out", value: minPtAmount },
      { name: "price_voucher", value: "priceVoucher" },
      { name: "py_state_id", value: coinConfig.pyStateId },
      {
        name: "market_factory_config_id",
        value: coinConfig.marketFactoryConfigId,
      },
      { name: "market_state_id", value: coinConfig.marketStateId },
      { name: "clock", value: "0x6" },
    ],
    typeArguments: [coinConfig.syCoinType],
  }

  const txMoveCall = {
    target: moveCallInfo.target,
    arguments: [
      tx.pure.u64(syAmount),
      tx.pure.u64(minPtAmount),
      priceVoucher,
      tx.object(coinConfig.pyStateId),
      tx.object(coinConfig.marketFactoryConfigId),
      tx.object(coinConfig.marketStateId),
      tx.object("0x6"),
    ],
    typeArguments: moveCallInfo.typeArguments,
  }

  const result = tx.moveCall(txMoveCall)

  return (returnDebugInfo ? [result, moveCallInfo] : result) as T extends true
    ? [TransactionResult, MoveCallInfo]
    : TransactionResult
}

interface RedeemPtParams<T extends boolean = false> {
  tx: Transaction
  coinConfig: CoinConfig
  pyPosition: TransactionArgument
  returnDebugInfo?: T
}

export const redeemPt = <T extends boolean = false>({
  tx,
  coinConfig,
  pyPosition,
  returnDebugInfo,
}: RedeemPtParams<T>): T extends true
  ? [TransactionResult, MoveCallInfo]
  : TransactionResult => {
  const moveCallInfo: MoveCallInfo = {
    target: `${coinConfig.nemoContractId}::py::redeem_pt`,
    arguments: [
      { name: "version", value: coinConfig.version },
      { name: "py_position", value: "pyPosition" },
      { name: "py_state", value: coinConfig.pyStateId },
      { name: "token_registry_state", value: coinConfig.tokenRegistryState },
      { name: "clock", value: "0x6" },
    ],
    typeArguments: [coinConfig.syCoinType, coinConfig.ptTokenType],
  }

  const txMoveCall = {
    target: moveCallInfo.target,
    arguments: [
      tx.object(coinConfig.version),
      pyPosition,
      tx.object(coinConfig.pyStateId),
      tx.object(coinConfig.tokenRegistryState),
      tx.object("0x6"),
    ],
    typeArguments: moveCallInfo.typeArguments,
  }

  const result = tx.moveCall(txMoveCall)

  return (returnDebugInfo ? [result, moveCallInfo] : result) as T extends true
    ? [TransactionResult, MoveCallInfo]
    : TransactionResult
}

interface BurnPtParams<T extends boolean = false> {
  tx: Transaction
  coinConfig: CoinConfig
  ptCoin: TransactionArgument
  pyPosition: TransactionArgument
  returnDebugInfo?: T
}

export const burnPt = <T extends boolean = false>({
  tx,
  ptCoin,
  pyPosition,
  coinConfig,
  returnDebugInfo,
}: BurnPtParams<T>): T extends true
  ? [TransactionResult, MoveCallInfo]
  : TransactionResult => {
  const moveCallInfo: MoveCallInfo = {
    target: `${coinConfig.nemoContractId}::py::burn_pt`,
    arguments: [
      { name: "version", value: coinConfig.version },
      { name: "pt_coin", value: ptCoin },
      { name: "py_position", value: pyPosition },
      { name: "py_state", value: coinConfig.pyStateId },
      { name: "token_registry_state", value: coinConfig.tokenRegistryState },
      { name: "clock", value: "0x6" },
    ],
    typeArguments: [coinConfig.syCoinType, coinConfig.ptTokenType],
  }

  const txMoveCall = {
    target: moveCallInfo.target,
    arguments: [
      tx.object(coinConfig.version),
      ptCoin,
      pyPosition,
      tx.object(coinConfig.pyStateId),
      tx.object(coinConfig.tokenRegistryState),
      tx.object("0x6"),
    ],
    typeArguments: moveCallInfo.typeArguments,
  }

  const result = tx.moveCall(txMoveCall)

  return (returnDebugInfo ? [result, moveCallInfo] : result) as T extends true
    ? [TransactionResult, MoveCallInfo]
    : TransactionResult
}
