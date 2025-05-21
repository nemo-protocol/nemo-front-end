import { debugLog } from "@/config"
import { MoveCallInfo } from "@/hooks/types"
import { CoinConfig } from "@/queries/types/market"
import { Transaction, TransactionArgument } from "@mysten/sui/transactions"

interface InitPyPositionParams<T extends boolean = false> {
  tx: Transaction
  coinConfig: CoinConfig
  pyPositions?: { id: string }[]
  returnDebugInfo?: T
}

type InitPyPositionResult<T extends boolean> = T extends true
  ? [{ pyPosition: TransactionArgument; created: boolean }, MoveCallInfo]
  : { pyPosition: TransactionArgument; created: boolean }

export const initPyPosition = <T extends boolean = false>({
  tx,
  coinConfig,
  pyPositions,
  returnDebugInfo,
}: InitPyPositionParams<T>): InitPyPositionResult<T> => {
  let pyPosition: TransactionArgument
  let created = false

  if (!pyPositions?.length) {
    created = true
    const moveCallInfo: MoveCallInfo = {
      target: `${coinConfig.nemoContractId}::py::init_py_position`,
      arguments: [
        { name: "version", value: coinConfig.version },
        { name: "py_state", value: coinConfig.pyStateId },
        { name: "clock", value: "0x6" },
      ],
      typeArguments: [coinConfig.syCoinType],
    }

    if (returnDebugInfo) {
      debugLog("init_py_position move call:", moveCallInfo)
    }

    const txMoveCall = {
      target: moveCallInfo.target,
      arguments: [
        tx.object(coinConfig.version),
        tx.object(coinConfig.pyStateId),
        tx.object("0x6"),
      ],
      typeArguments: moveCallInfo.typeArguments,
    }

    const [result] = tx.moveCall(txMoveCall)
    pyPosition = result

    return (
      returnDebugInfo
        ? [{ pyPosition, created }, moveCallInfo]
        : { pyPosition, created }
    ) as InitPyPositionResult<T>
  } else {
    const moveCallInfo: MoveCallInfo = {
      target: `0x2::object::object`,
      arguments: [{ name: "id", value: pyPositions[0].id }],
      typeArguments: [],
    }

    if (returnDebugInfo) {
      debugLog("object move call:", moveCallInfo)
    }

    pyPosition = tx.object(pyPositions[0].id)

    return (
      returnDebugInfo
        ? [{ pyPosition, created }, moveCallInfo]
        : { pyPosition, created }
    ) as InitPyPositionResult<T>
  }
}
