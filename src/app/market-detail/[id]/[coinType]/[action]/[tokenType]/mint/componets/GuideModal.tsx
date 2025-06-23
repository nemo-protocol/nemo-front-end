import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

export default function GuideModal() {
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
          <span className="text-gray-400 text-sm">How it works</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogOverlay className="backdrop-blur-sm" />
      <AlertDialogContent className="bg-transparent border-none p-12 max-w-[1200px] max-h-[90vh] overflow-y-auto text-white">
        <AlertDialogTitle className="text-[32px] text-center mb-6 [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)] font-serif">
          What is Minting?
        </AlertDialogTitle>
        <AlertDialogCancel asChild className="border-none">
          <button className="absolute top-6 right-6 z-10 text-gray-400 hover:text-gray-200">
            <Image
              src="/assets/images/close.svg"
              alt="close"
              width={20}
              height={20}
            />
          </button>
        </AlertDialogCancel>

        {/* 主要内容 */}
        <div className="flex flex-col gap-y-8 items-center w-[400px] mx-auto">
          {/* 描述文字 */}
          <p className="text-light-gray/40">
            Minting is the process of converting underlying assets into PT and
            YT.
          </p>

          {/* Minting 流程图 */}
          <div className="w-[400px] py-[40px] font-serif text-light-gray">
            <div className="flex items-center justify-between mb-16">
              {/* BALANCE */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">BALANCE</div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    alt="SUI"
                    width={16}
                    height={16}
                    src="/assets/images/sui.svg"
                  />
                  <span className="text-sm">SUI</span>
                </div>
              </div>

              {/* MINT 操作 */}
              <div className="space-x-1 text-sm bg-light-gray/[0.03] py-1 px-1.5 rounded-lg">
                <span>–</span>
                <span>MINT</span>
                <span>→</span>
              </div>

              {/* PRINCIPAL TOKEN */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">
                  PRINCIPAL TOKEN
                </div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={12}
                    height={12}
                  />
                  <span className="text-sm">PT sSUI</span>
                </div>
              </div>

              {/* + 号 */}
              <div className="text-2xl">+</div>

              {/* YIELD TOKEN */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">
                  YIELD TOKEN
                </div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={12}
                    height={12}
                  />
                  <span className="text-sm">YT sSUI</span>
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-b border-light-gray/10 mb-16"></div>

            {/* What is Redeeming? 标题 */}
            <div className="text-[32px] text-center mb-8 [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)] font-serif">
              What is Redeeming?
            </div>

            {/* 描述文字 */}
            <div className="text-left mb-8 text-sm max-w-[500px] mx-auto">
              <p className="text-light-gray/40">
                Redeeming is the process of converting PT and YT into underlying
                assets.
              </p>
            </div>

            {/* Redeeming 流程图 */}
            <div className="flex items-center justify-between">
              {/* PRINCIPAL TOKEN */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">
                  PRINCIPAL TOKEN
                </div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={12}
                    height={12}
                  />
                  <span className="text-sm">PT sSUI</span>
                </div>
              </div>

              {/* + 号 */}
              <div className="text-2xl">+</div>

              {/* YIELD TOKEN */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">
                  YIELD TOKEN
                </div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={12}
                    height={12}
                  />
                  <span className="text-sm">YT sSUI</span>
                </div>
              </div>

              {/* REDEEM 操作 */}
              <div className="space-x-1 text-sm bg-light-gray/[0.03] py-1 px-1.5 rounded-lg">
                <span>–</span>
                <span>REDEEM</span>
                <span>→</span>
              </div>

              {/* BALANCE */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">BALANCE</div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    alt="SUI"
                    width={16}
                    height={16}
                    src="/assets/images/sui.svg"
                  />
                  <span className="text-sm">SUI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 关闭按钮 */}
        <div className="flex justify-center mt-8">
          <AlertDialogCancel asChild className="border-none rounded-full">
            <button className="w-[400px] bg-light-gray/[0.03] py-4 rounded-full text-sm">
              Close
            </button>
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
