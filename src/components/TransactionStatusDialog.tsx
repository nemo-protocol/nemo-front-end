import React from "react"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Image from "next/image"

interface TransactionStatusDialogProps {
  open: boolean
  status?: "Success" | "Failed"
  network?: string
  txId: string
  message?: string
  onClose: () => void
}

// TODO: T0: add global toast
const TransactionStatusDialog: React.FC<TransactionStatusDialogProps> = ({
  open,
  status,
  network = "mainnet",
  txId,
  message,
  onClose,
}) => {
  const ViewDetailsPopover = () => (
    <Popover>
      <PopoverTrigger className="text-[#8FB5FF] underline">
        View details
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-[#1A1B23] border-none rounded-xl">
        <div className="flex flex-col gap-2">
          <a
            className="text-white hover:text-[#8FB5FF] transition-colors"
            href={`https://suivision.xyz/txblock/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/10">
              <Image
                src="/assets/images/logo/suivision.svg"
                alt="SuiVision"
                className="w-4 h-4"
                width={16}
                height={16}
              />
              <span>SuiVision</span>
            </div>
          </a>
          <a
            className="text-white hover:text-[#8FB5FF] transition-colors"
            href={`https://suiscan.xyz/${network}/tx/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/10">
              <Image
                src="/assets/images/logo/suiscan.png"
                alt="Suiscan"
                className="w-4 h-4"
                width={16}
                height={16}
              />
              <span>Suiscan</span>
            </div>
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-[#0e0f15] border-none rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-white">
            {status}
          </AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col items-center">
            {status === "Success" ? (
              <Image
                src="/assets/images/success.svg"
                alt="success"
                className="size-10"
                width={40}
                height={40}
              />
            ) : (
              <Image
                src="/assets/images/fail.svg"
                alt="fail"
                className="size-10"
                width={40}
                height={40}
              />
            )}
            {status === "Success" && (
              <div className="py-2 flex flex-col gap-y-1 items-center">
                <div className="text-white/50">Transaction submitted!</div>
                <ViewDetailsPopover />
              </div>
            )}
            {status === "Failed" && (
              <div className="py-2 flex flex-col gap-y-1 items-center">
                <div className="text-red-400">Transaction Error</div>
                <div className="text-red-500 max-w-[446px] break-words whitespace-pre-wrap">
                  {message}
                </div>
                {txId && <ViewDetailsPopover />}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center justify-center">
          <button
            className="text-white w-36 rounded-3xl bg-[#0F60FF] py-1.5"
            onClick={onClose}
          >
            OK
          </button>
        </div>
        <AlertDialogFooter></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default TransactionStatusDialog
