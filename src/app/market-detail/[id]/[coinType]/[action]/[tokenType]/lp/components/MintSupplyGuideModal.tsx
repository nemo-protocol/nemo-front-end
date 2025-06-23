import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

export default function MintSupplyGuideModal() {
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
      <AlertDialogContent className="bg-transparent border-none p-12 max-w-[1200px] text-white">
        <AlertDialogTitle className="text-[32px] text-center mb-6 [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)] font-serif">
          What is Mint & Supply?
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
              Instead use the supplied liquidity to mint PT and supply with no
              price impact, which also mints YT as a side effect.
            </p>

            <div className="space-y-3">
              <p className="text-light-gray/60 font-medium">
                When to use Mint & Supply:
              </p>
              <ul className="space-y-2 text-light-gray/40">
                <li className="flex items-start gap-2">
                  <span className="text-light-gray/60 mt-1">•</span>
                  <span>
                    If you want to retain higher underlying yield and points
                    exposure through YT minted and are neutral on the underlying
                    APY.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-light-gray/60 mt-1">•</span>
                  <span>If you add relatively many underlying assets.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 流程图 */}
          <div className="w-[900px] py-[40px] font-serif text-light-gray">
            <div
              className="grid grid-cols-5 gap-6"
              style={{ gridTemplateRows: "auto auto minmax(40px, 1fr) auto" }}
            >
              {/* 第1行: MINT TO YT */}
              <div className="col-start-4 row-start-1 flex flex-col items-center">
                <div className="text-[#1785B7] text-xs mb-4">MINT TO YT</div>
                <div className="text-2xl mb-1.5">45</div>
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

              {/* 第2行: BALANCE + TOKEN SPLIT + MINT TO PT */}
              <div className="col-start-1 row-start-2 flex flex-col items-center">
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

              <div className="col-start-2 row-start-2 flex justify-center items-center">
                <div className="space-x-1 text-sm bg-light-gray/[0.03] py-1 px-1.5 rounded-lg">
                  <span>–</span>
                  <span>TOKEN SPLIT</span>
                  <span>→</span>
                </div>
              </div>

              <div className="col-start-3 row-start-2 flex flex-col items-center">
                <div className="text-[#17B69B] text-xs mb-4">MINT TO PT</div>
                <div className="text-2xl mb-1.5">45</div>
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

              {/* 第3行: + 号 和 ADD LIQUIDITY → LP sSUI */}
              <div className="col-start-3 row-start-3 flex justify-center items-center">
                <div className="text-2xl">+</div>
              </div>

              <div className="col-start-4 row-start-3 flex justify-center items-center gap-4">
                <div className="space-x-1 text-sm bg-[#956EFF]/10 text-[#956EFF] py-1 px-1.5 rounded-lg">
                  <span>–</span>
                  <span>ADD LIQUIDITY</span>
                  <span>→</span>
                </div>
              </div>

              <div className="col-start-5 row-start-3 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={16}
                    height={16}
                  />
                  <span className="text-sm">LP sSUI</span>
                </div>
              </div>

              {/* 第4行: CONVERT */}
              <div className="col-start-3 row-start-4 flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-2">CONVERT</div>
                <div className="text-2xl mb-1">55</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={12}
                    height={12}
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
