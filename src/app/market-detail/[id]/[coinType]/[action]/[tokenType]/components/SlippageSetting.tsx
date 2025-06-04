import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"
import Image from "next/image"

interface SlippageSettingProps {
  slippage: string
  setSlippage: (value: string) => void
}

const SlippageSetting: React.FC<SlippageSettingProps> = ({
  slippage,
  setSlippage,
}) => {
  const [open, setOpen] = useState(false)
  const [tempSlippage, setTempSlippage] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const handleSlippageChange = (value: string) => {
    setSelectedPreset(value)
    setTempSlippage("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempSlippage(e.target.value)
    setSelectedPreset(null)
  }

  const handleConfirm = () => {
    const finalValue = selectedPreset || tempSlippage
    if (finalValue) {
      setSlippage(finalValue)
    }
    setOpen(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleConfirm()
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-x-1 sm:gap-x-2 cursor-pointer bg-[#161720]/50 rounded-full">
          <span className="text-white/60 text-xs sm:text-sm">{slippage}%</span>
          <Image
            src="/assets/images/edit.svg"
            alt="edit"
            width={16}
            height={16}
          />
        </div>
      </PopoverTrigger>
      {/* FIXME: tailwind animation not working */}
      <PopoverContent className="w-[280px] sm:w-80 bg-[#0E1520] border border-[#3F3F3F] rounded-3xl px-[30px] py-5">
        <div className="grid gap-3 sm:gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-xs sm:text-sm py-1.5 sm:py-2 text-white">
              Slippage Setting
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-x-1.5 sm:gap-x-2 gap-y-3 sm:gap-y-4">
            <button
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-[28px] text-[10px] sm:text-xs text-white ${
                selectedPreset === "0.1" ? "bg-[#2E81FC]" : "bg-[#36394B5C]"
              }`}
              onClick={() => handleSlippageChange("0.1")}
            >
              0.1%
            </button>
            <button
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-[28px] text-[10px] sm:text-xs text-white ${
                selectedPreset === "0.5" ? "bg-[#2E81FC]" : "bg-[#36394B5C]"
              }`}
              onClick={() => handleSlippageChange("0.5")}
            >
              0.5%
            </button>
            <button
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-[28px] text-[10px] sm:text-xs text-white ${
                selectedPreset === "1" ? "bg-[#2E81FC]" : "bg-[#36394B5C]"
              }`}
              onClick={() => handleSlippageChange("1")}
            >
              1%
            </button>
            <div className="relative col-span-3">
              <input
                type="text"
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#36394B5C] rounded-[28px] placeholder:text-[10px] sm:placeholder:text-xs w-full outline-none text-white text-[10px] sm:text-xs"
                placeholder="Custom"
                value={tempSlippage}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-white mt-0.5">
                %
              </span>
            </div>
            <button
              className="col-span-3 px-4 py-2.5 bg-[#2E81FC]/90 hover:bg-[#2E81FC]/80 rounded-[28px] text-sm text-white font-medium"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default SlippageSetting
