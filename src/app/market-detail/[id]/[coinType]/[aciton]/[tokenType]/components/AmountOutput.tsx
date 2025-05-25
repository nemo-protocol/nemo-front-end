import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeDiff } from "@/lib/utils";
import dayjs from "dayjs";
import Image from "next/image";

interface AmountOutputProps {
  value: string;
  loading?: boolean;
  maturity: string;
  coinConfig?: {
    coinLogo?: string;
    coinName?: string;
  };
}

export const AmountOutput = ({
  value,
  loading = false,
  maturity,
  coinConfig,
}: AmountOutputProps) => {
  return (
    <div className="bg-[#FCFCFC]/[0.03] rounded-2xl shadow-lg px-6 py-6 w-full flex items-center justify-between min-h-[80px]">
      {/* 左侧：LP POSITION 和数值 */}
      <div className="flex flex-col justify-center">
        <span className="text-xs text-[#FCFCFC]/40 font-medium">
          Receive
        </span>
        <span className="mt-2 text-2xl sm:text-3xl font-bold text-white flex items-center gap-x-2">
          {loading ? (
            <Skeleton className="h-7 sm:h-8 w-36 sm:w-48 bg-[#FCFCFC]/[0.03]" />
          ) : (
            value
          )}
        </span>
      </div>

      {/* 右侧：LP xSUI、图标和剩余天数 */}
      <div className="flex flex-col items-end justify-center gap-y-1">
        <div className="flex items-center gap-x-2">
          <span className="text-xl font-[650] text-white">LP xSUI</span>
          {coinConfig?.coinLogo && (
            <Image
              src={coinConfig.coinLogo}
              alt={coinConfig.coinName || ""}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
        </div>
        <span className="text-xs text-[#FCFCFC]/40 mt-1.5 flex items-center gap-x-1">
          <span>
            {`${formatTimeDiff(parseInt(maturity))} LEFT・ ${dayjs(
              parseInt(maturity)
            ).format("DD MMM YYYY")}`}
          </span>
          <Image
            src="/assets/images/date.svg"
            alt="date"
            width={12}
            height={12}
          />
        </span>
      </div>
    </div>
  );
}; 