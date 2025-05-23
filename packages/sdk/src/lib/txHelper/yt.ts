import {
  Transaction,
  TransactionResult,
  TransactionArgument,
} from "@mysten/sui/transactions"
import { MoveCallInfo } from "@/hooks/types"
import { CoinConfig } from "@/types"

interface ClaimYtParams<T extends boolean = false> {
  tx: Transaction
  coinConfig: CoinConfig
  pyPosition: TransactionArgument
  priceVoucher: TransactionArgument
  returnDebugInfo?: T
}

export const claimYtInterest = <T extends boolean = false>({
  tx,
  coinConfig,
  pyPosition,
  priceVoucher,
  returnDebugInfo,
}: ClaimYtParams<T>): T extends true
  ? [TransactionResult, MoveCallInfo]
  : TransactionResult => {
  const moveCallInfo: MoveCallInfo = {
    target: `${coinConfig.nemoContractId}::yield_factory::redeem_due_interest`,
    arguments: [
      { name: "version", value: coinConfig.version },
      { name: "py_position", value: pyPosition },
      { name: "py_state", value: coinConfig.pyStateId },
      { name: "price_voucher", value: priceVoucher },
      { name: "yield_factory_config", value: coinConfig.yieldFactoryConfigId },
      { name: "clock", value: "0x6" },
    ],
    typeArguments: [coinConfig.syCoinType],
  }

  const txMoveCall = {
    target: moveCallInfo.target,
    arguments: [
      tx.object(coinConfig.version),
      pyPosition,
      tx.object(coinConfig.pyStateId),
      priceVoucher,
      tx.object(coinConfig.yieldFactoryConfigId),
      tx.object("0x6"),
    ],
    typeArguments: moveCallInfo.typeArguments,
  }

  const result = tx.moveCall(txMoveCall)

  return (returnDebugInfo ? [result, moveCallInfo] : result) as T extends true
    ? [TransactionResult, MoveCallInfo]
    : TransactionResult
}
