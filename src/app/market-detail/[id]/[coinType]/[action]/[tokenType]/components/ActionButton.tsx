import React, { useMemo } from "react"
import { ConnectModal, useWallet } from "@nemoprotocol/wallet-kit"

interface ActionButtonProps {
  btnText: string
  loading?: boolean
  disabled: boolean
  onClick: () => void
  type?: "green" | "red" | "blue" | "errorRed"
}



const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  btnText,
  disabled,
  loading = false,
  type = 'green',
}) => {
  const { address } = useWallet()
  const typeColor: Record<string, {
    color: string,
    hover: string,
    icon: string,
    disabled:string
  }> = {
    green: {
      color: 'bg-[#4cc877e5]',
      disabled: 'bg-[#4cc877a5]',
      hover: 'hover:bg-[#4cc877c5]',
      icon: '/buy-button-icon.svg'
    },
    red: {
      color: 'bg-[#FF2E54E5]',
      disabled: 'bg-[#FF2E54a5]',
      hover: 'hover:bg-[#FF2E54c5]',
      icon: '/sell-button-icon.svg'

    },
    blue: {
      color: 'bg-[#2E81FCE5]',
      disabled: 'bg-[#2E81FCa5]',
      hover: 'hover:bg-[#2E81FCc5]',
      icon: '/connect-button-icon.svg'

    },
    errorRed: {
      color: 'bg-[#ff2e54e5]',
      disabled: 'bg-[#ff2e54a5]',

      hover: 'hover:bg-[#ff2e54c5]',
      icon: '/error-button-icon.svg'

    }

  };
  const isConnected = useMemo(() => !!address, [address])
  return (
    <>
      {!isConnected ? (
        <ConnectModal>
          <button className="px-4 sm:px-8 bg-[#2E81FCE5] hover:bg-[#2E81FCc5] text-white rounded-full w-full h-[42px] text-sm font-[500]   sm:text-base cursor-pointer">
            Connect Wallet
          </button>
        </ConnectModal>
      ) : disabled ? (
        <div className={`px-4 sm:px-8 ${typeColor[type].disabled} text-white/70 gap-2  font-[500]  rounded-full w-full h-[42px] text-sm sm:text-base  flex items-center justify-center select-none`}>
          {btnText}
        </div>
      ) : (
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={[
            "px-4 sm:px-8 rounded-full w-full h-[42px] text-sm sm:text-base flex items-center font-[500]  justify-center gap-2 sm:gap-2 select-none",
            disabled || loading
              ? `${typeColor[type].disabled} text-white/70 cursor-not-allowed`
              : `${typeColor[type].color} ${typeColor[type].hover} transition text-white cursor-pointer`,
          ].join(" ")}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-2 border-b-transparent border-white/50" />
          )}
          <>
            {/* <Image src={typeColor[type].icon} alt="" width={15} height={15} className="shrink-0" /> */}
            {loading ? "Processing..." : btnText}
          </>
        </button>
      )}
    </>
  )
}

export default ActionButton
