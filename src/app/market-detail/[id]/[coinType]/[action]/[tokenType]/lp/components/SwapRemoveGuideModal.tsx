import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

export default function SwapRemoveGuideModal() {
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
          <span className="text-light-gray/40 hover:text-white text-sm">
            How it works
          </span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogOverlay className="backdrop-blur-sm" />
      <AlertDialogContent className="bg-transparent border-none p-12 max-w-[1200px] text-light-gray font-sans max-h-[90vh] overflow-y-auto">
        <AlertDialogTitle className="text-[32px] text-center mb-6 [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)] font-serif">
          What is Swap & Remove?
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
        <div className="flex flex-col gap-y-8 items-center">
          {/* 描述文字 */}
          <div className="text-left space-y-4 mb-6 text-sm max-w-[600px]">
            <p className="text-light-gray/40">
              A portion of the liquidity removal is used to swap SUI, causing
              price impact. This is similar to supplying in traditional AMMs.
            </p>

            <div className="space-y-3">
              <p className="text-light-gray/40">When to use Swap & Remove:</p>
              <ul className="space-y-2 text-light-gray/40">
                <li className="flex items-start gap-2">
                  <span className="text-light-gray/40 mt-1">•</span>
                  <span>
                    If you want exposure to only one position (underlying asset
                    tokens) and want to avoid managing PT.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-light-gray/40 mt-1">•</span>
                  <span>If you remove relatively few underlying assets.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 流程图 */}
          <div className="w-[1000px] py-[40px] flex justify-center">
            <div
              className="grid gap-8 w-full"
              style={{ 
                gridTemplateColumns: "1fr 2fr 1.8fr 1.5fr 1fr",
                gridTemplateRows: "auto auto auto" 
              }}
            >
              {/* 第1行: SWAP TO UNDERLYING ASSETS 和 PT SUI → sSUI 在第3列 */}
              <div className="col-start-3 row-start-1 flex flex-col items-center gap-4">
                <div className="space-x-1 text-sm bg-[#22c55e]/10 text-[#22c55e] py-1 px-1.5 rounded-lg">
                  <span>SWAP TO UNDERLYING ASSETS</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/assets/images/sui.svg"
                      alt="PT SUI"
                      width={16}
                      height={16}
                    />
                    <span className="text-sm">PT SUI</span>
                  </div>
                  <div className="text-xl">→</div>
                  <div className="flex items-center gap-2">
                    <Image
                      src="/assets/images/sui.svg"
                      alt="sSUI"
                      width={16}
                      height={16}
                    />
                    <span className="text-sm">sSUI</span>
                  </div>
                </div>
              </div>

              {/* 第2行: BALANCE + REMOVE LIQUIDITY + + + TOKEN SPLIT + SUI */}
              <div className="col-start-1 row-start-2 flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">BALANCE</div>
                <div className="flex items-center gap-2">
                  <Image
                    alt="LP sSUI"
                    width={16}
                    height={16}
                    src="/assets/images/sui.svg"
                  />
                  <span className="text-sm">LP sSUI</span>
                </div>
              </div>

              <div className="col-start-2 row-start-2 flex justify-center items-center">
                <div className="space-x-1 text-sm bg-[#956EFF]/10 text-[#956EFF] py-2 px-4 rounded-lg">
                  <span>–</span>
                  <span>REMOVE LIQUIDITY</span>
                  <span>→</span>
                </div>
              </div>

              {/* 第2行: + 号 */}
              <div className="col-start-3 row-start-2 flex justify-center items-end">
                <div className="text-2xl">+</div>
              </div>

              {/* 第2行继续: TOKEN SPLIT + SUI */}
              <div className="col-start-4 row-start-2 flex justify-center items-center">
                <div className="space-x-1 text-sm bg-light-gray/[0.03] py-1 px-1.5 rounded-lg">
                  <span>–</span>
                  <span>TOKEN SPLIT</span>
                  <span>→</span>
                </div>
              </div>

              <div className="col-start-5 row-start-2 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm">SUI</span>
                </div>
              </div>

              {/* 第3行: CONVERT */}
              <div className="col-start-3 row-start-3 flex flex-col items-center justify-center">
                <div className="text-light-gray/40 text-xs mb-4">CONVERT</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="sSUI"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm">sSUI</span>
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