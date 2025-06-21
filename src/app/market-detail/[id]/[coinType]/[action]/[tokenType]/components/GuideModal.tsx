import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

interface GuideModalProps {
  imageUrl: string
}

export default function GuideModal({ imageUrl }: GuideModalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex items-center gap-x-2 w-full justify-center">
          <Image
            src="/assets/images/question.svg"
            alt="How it works"
            width={16}
            height={16}
          />
          <span className="text-light-gray/40 text-sm">How it works</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogOverlay className="backdrop-blur-sm" />
      <AlertDialogContent className="bg-transparent border-none p-0 max-w-5xl shadow-none flex flex-col items-center gap-y-8">
        <AlertDialogTitle></AlertDialogTitle>
        <AlertDialogCancel asChild className="border-none">
          <button className="absolute top-0 right-0 z-10 text-light-gray/40 hover:text-light-gray">
            <Image
              src="/assets/images/close.svg"
              alt="close"
              width={20}
              height={20}
            />
          </button>
        </AlertDialogCancel>
        <Image
          src={imageUrl}
          alt="How it works guide"
          width={1024}
          height={720}
          className="rounded-2xl"
        />
        <AlertDialogCancel asChild className="border-none rounded-full">
          <button className="w-[400px] bg-light-gray/[0.03] border border-light-gray/10 text-light-gray/40 py-3 rounded-full">
            Close
          </button>
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  )
}
