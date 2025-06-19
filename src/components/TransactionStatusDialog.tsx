import React from "react"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { ExternalLink } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TransactionStatusDialogProps {
  open: boolean
  txId: string
  message?: string
  network?: string
  onClose: () => void
  status?: "Success" | "Failed"
}

// TODO: T0: add global toast
const TransactionStatusDialog: React.FC<TransactionStatusDialogProps> = ({
  open,
  status,
  txId,
  message,
  network,
  onClose,
}) => {
  const ViewDetailsPopover = () => (
    <Popover>
      <PopoverTrigger className="flex items-center gap-1 text-light-gray/40 underline underline-offset-2 text-xs transition-colors">
        REVIEW TX DETAILS
        <ExternalLink size={18} className="ml-1" />
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
      <AlertDialogContent className="bg-light-gray/[0.03] border border-[#6D7177] rounded-3xl px-6 max-w-[480px] w-full shadow-2xl backdrop-blur-[25px]">
        <AlertDialogHeader>
          <div className="flex flex-col items-center w-full">
            <div className="text-light-gray/40 text-xs  mb-6 text-center mt-6">
              {status === "Success"
                ? "THE FOLLOWING TRANSACTIONS HAVE BEEN COMPLETED:"
                : "YOU MAY ENCOUNTER SOME ERRORS."}
            </div>
            <AlertDialogTitle
              className={`text-white text-center mb-5 font-serif font-normal ${
                status === "Success" ? "text-[56px]" : "text-[32px]"
              }`}
            >
              {status === "Success" ? "Successful!" : "Transaction Error."}
            </AlertDialogTitle>
            {status === "Success" ? (
              <ViewDetailsPopover />
            ) : (
              <span className="text-[#FF2E54] text-sm">
                Request Signature: {message}
              </span>
            )}
          </div>
        </AlertDialogHeader>
        <div className="flex items-center justify-center mt-[46px]">
          <button
            className="text-white w-full text-sm rounded-full bg-[#256DFF] h-10 hover:bg-[#1A4FCC] transition-colors"
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
