import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DOCS_LINK } from "@/lib/constants"
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
          <span className="text-light-gray/40 hover:text-white text-sm">
            How it works
          </span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogOverlay className="backdrop-blur-sm" />
      <AlertDialogContent className="bg-transparent border-none p-12 max-w-[1000px] text-white">
        <AlertDialogTitle className="text-[32px] text-center mb-6 [text-shadow:0px_0px_32px_rgba(239,244,252,0.56)] font-serif">
          What is Principal Token (PT)?
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
          <div className="max-w-[400px]">
            {/* 描述文字 */}
            <div className="text-left space-y-4 mb-6 text-sm">
              <p className="text-light-gray/40 ">
                Principal Token (PT) entitles you to the principal of the
                underlying yield-bearing token, redeemable after maturity. You
                could read more in official docs.
              </p>

              {/* View docs 链接 */}
              <a
                target="_blank"
                href={DOCS_LINK}
                className="text-light-gray flex items-center gap-x-2"
              >
                <span>View docs</span>
                <Image
                  src="/assets/images/link.svg"
                  alt="link"
                  width={16}
                  height={16}
                />
              </a>

              <p className="text-light-gray/40">
                If you own 100 PT sSUI with 3 months maturity, you will be able
                to redeem 100 SUI worth of stETH after 3 months.
              </p>
            </div>
          </div>

          {/* 流程展示 - 水平流程图 */}
          <div className="w-full py-[60px] font-serif text-light-gray">
            <div className="flex items-center justify-between">
              {/* BALANCE */}
              <div className="flex flex-col items-center">
                <div className="text-light-gray/40 text-xs mb-4">BALANCE</div>
                <div className="text-2xl mb-1.5">90</div>
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

              {/* BUY 操作 */}
              <div className="space-x-1 text-sm bg-light-gray/[0.03] py-1 px-1.5 rounded-lg">
                <span>–</span>
                <span>BUY</span>
                <span>→</span>
              </div>

              {/* PRINCIPAL TOKEN */}
              <div className="flex flex-col items-center">
                <div className="text-xs mb-4">PRINCIPAL TOKEN</div>
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

              {/* HOLD 操作 */}
              <div className="space-x-1 text-sm bg-[#2E81FC]/10 text-[#2E81FC] py-1 px-1.5 rounded-lg">
                <span>–</span>
                <span>HOLD</span>
                <span>→</span>
              </div>

              {/* REDEEM */}
              <div className="flex flex-col items-center">
                <div className="text-xs mb-4">REDEEM</div>
                <div className="text-2xl mb-1.5">3 months</div>
                <div className="text-sm">After</div>
              </div>

              {/* CLAIM 操作 */}
              <div className="space-x-1 text-sm bg-[#4CC877]/10 text-[#4CC877] py-1 px-1.5 rounded-lg">
                <span>–</span>
                <span>CLAIM</span>
                <span>→</span>
              </div>

              {/* YIELD */}
              <div className="flex flex-col items-center">
                <div className="text-[#4CC877] text-xs font-medium mb-4">
                  YIELD
                </div>
                <div className="text-2xl mb-1.5">100</div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/images/sui.svg"
                    alt="SUI"
                    width={12}
                    height={12}
                  />
                  <span className="text-white text-sm">SUI</span>
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
