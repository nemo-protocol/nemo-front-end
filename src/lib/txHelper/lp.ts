import {
  Transaction,
  TransactionResult,
  TransactionArgument,
} from "@mysten/sui/transactions"
import { MoveCallInfo } from "@/hooks/types"
import { CoinConfig } from "@/queries/types/market"
import { debugLog } from "@/config"

interface BurnLpParams<T extends boolean = false> {
  tx: Transaction
  coinConfig: CoinConfig
  lpAmount: string
  pyPosition: TransactionArgument
  marketPosition: TransactionArgument
  returnDebugInfo?: T
}

export const burnLp = <T extends boolean = false>({
  tx,
  coinConfig,
  lpAmount,
  pyPosition,
  marketPosition,
  returnDebugInfo,
}: BurnLpParams<T>): T extends true ? [TransactionResult, MoveCallInfo] : TransactionResult => {
  const moveCallInfo: MoveCallInfo = {
    target: `${coinConfig.nemoContractId}::market::burn_lp`,
    arguments: [
      { name: "version", value: coinConfig.version },
      { name: "lp_amount", value: lpAmount },
      { name: "py_position", value: "pyPosition" },
      { name: "market_state", value: coinConfig.marketStateId },
      { name: "market_position", value: marketPosition },
      { name: "clock", value: "0x6" },
    ],
    typeArguments: [coinConfig.syCoinType],
  }

  if (returnDebugInfo) {
    debugLog("burn_lp move call:", moveCallInfo)
  }

  const txMoveCall = {
    target: moveCallInfo.target,
    arguments: [
      tx.object(coinConfig.version),
      tx.pure.u64(lpAmount),
      pyPosition,
      tx.object(coinConfig.marketStateId),
      marketPosition,
      tx.object("0x6"),
    ],
    typeArguments: moveCallInfo.typeArguments,
  }

  const result = tx.moveCall(txMoveCall)

  return (returnDebugInfo ? [result, moveCallInfo] : result) as T extends true
    ? [TransactionResult, MoveCallInfo]
    : TransactionResult
}
