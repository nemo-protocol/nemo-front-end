import React, { useMemo } from "react"
import { ConnectModal, useWallet } from "@nemoprotocol/wallet-kit"

interface ActionButtonProps {
  btnText: string
  loading?: boolean
  disabled: boolean
  onClick: () => void
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  btnText,
  disabled,
  loading = false,
}) => {
  const { address } = useWallet()

  const isConnected = useMemo(() => !!address, [address])
  return (
    <>
      {!isConnected ? (
        <ConnectModal>
          <button className="px-4 sm:px-8 bg-[#0F60FF] text-white rounded-full w-full h-[42px] text-sm sm:text-base cursor-pointer">
            Connect Wallet
          </button>
        </ConnectModal>
      ) : disabled ? (
        <div className="px-4 sm:px-8 bg-[#0F60FF]/50 text-white/50 rounded-full w-full h-[42px] text-sm sm:text-base  flex items-center justify-center select-none">
          {btnText}
        </div>
      ) : (
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={[
            "px-4 sm:px-8 rounded-full w-full h-[42px] text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 select-none",
            disabled || loading
              ? "bg-[#0F60FF]/50 text-white/50 cursor-not-allowed"
              : "bg-[#0F60FF] text-white cursor-pointer",
          ].join(" ")}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-2 border-b-transparent border-white/50" />
          )}
          {loading ? "Processing..." : btnText}
        </button>
      )}
    </>
  )
}

export default ActionButton
