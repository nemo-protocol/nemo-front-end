import Decimal from "decimal.js";
import { bcs } from "@mysten/sui/bcs";
import { formatDecimalValue } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import { redeemSyCoin } from "@/lib/txHelper";
import { useSuiClient, useWallet } from "@nemoprotocol/wallet-kit";
import { getPriceVoucher } from "@/lib/txHelper/price";
import type { PortfolioItem } from "@/queries/types/market";
import type { PyPosition, DebugInfo } from "../types";
import { useSearchParams } from "next/navigation";   // ← NEW
import { isExpired } from "@/app/portfolio/Assets";
import { NO_SUPPORT_YT_COINS } from "@/lib/constants";

interface ClaimYtRewardParams {
  filteredYTLists: PortfolioItem[];
  pyPositionsMap?: Record<
    string,
    { ptBalance: string; ytBalance: string; pyPositions: PyPosition[] }
  >;
}

export default function useQueryClaimAllYtReward(params: ClaimYtRewardParams) {
  const client = useSuiClient();
  const { address } = useWallet();

  /* ------------ 计算最终地址 ------------ */
  const searchParams = useSearchParams();
  const mockAddressRaw = searchParams.get("mockAddress");

  const effectiveAddress =
    process.env.NEXT_PUBLIC_DEBUG && mockAddressRaw
      ? mockAddressRaw
      : address;

  return useQuery({
    queryKey: ["claimYtReward", effectiveAddress],
    enabled: !!effectiveAddress && params.filteredYTLists.length !== 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      if (!effectiveAddress) {
        throw new Error("Please connect wallet first");
      }

      /* ---------- 构造 transaction ---------- */
      const tx = new Transaction();
      tx.setSender(effectiveAddress);
      params.filteredYTLists.forEach((item, index) => {

        const balance = params.pyPositionsMap?.[item.id]?.ytBalance;
        const pyPositions = params.pyPositionsMap?.[item.id]?.pyPositions;
        const coinConfig = item;

        let pyPosition;
        let created = false;
        if (!pyPositions?.length) {
          created = true;
          const [pos] = tx.moveCall({
            target: `${coinConfig.nemoContractId}::py::init_py_position`,
            arguments: [
              tx.object(coinConfig.version),
              tx.object(coinConfig.pyStateId),
            ],
            typeArguments: [coinConfig.syCoinType],
          });
          pyPosition = pos;
        } else {
          pyPosition = tx.object(pyPositions[0].id);
        }

        /* 2. price_voucher & redeem_due_interest */
        const [priceVoucher] = getPriceVoucher(tx, coinConfig);

        const [syCoin] = tx.moveCall({
          target: `${coinConfig.nemoContractId}::yield_factory::redeem_due_interest`,
          arguments: [
            tx.object(coinConfig.version),
            pyPosition,
            tx.object(coinConfig.pyStateId),
            priceVoucher,
            tx.object(coinConfig.yieldFactoryConfigId),
            tx.object("0x6"), // clock
          ],
          typeArguments: [coinConfig.syCoinType],
        });
        /* 3. 把 syCoin 兑换为 yieldToken, 再查看面值 */
        const yieldToken = redeemSyCoin(tx, coinConfig, syCoin);

        tx.moveCall({
          target: `0x2::coin::value`,
          arguments: [yieldToken],
          typeArguments: [coinConfig.coinType],
        });

        /* 4. 如果刚创建 py_position，要转回给用户（模拟）*/
        if (created) {
          tx.transferObjects([pyPosition], effectiveAddress);
        }
      });

      /* ---------- dev-inspect ---------- */
      const result = await client.devInspectTransactionBlock({
        sender: effectiveAddress,
        transactionBlock: await tx.build({
          client,
          onlyTransactionKind: true,
        }),
      });
      console.log(result, 'sixu')
      /* ---------- 解析返回的 u64 ---------- */
      const pyReward: Record<string, string> = {};
      params.filteredYTLists.forEach((item, index) => {

        const decimal = Number(item.decimal);
        const syAmount = bcs.U64.parse(
          new Uint8Array(
            result.results[index * 4 + 3].returnValues[0][0], // (index+1)*4-1 == index*4+3
          ),
        );

        pyReward[item.id] = formatDecimalValue(
          new Decimal(syAmount).div(10 ** decimal).toString(),
          decimal,
        );
      });

      return pyReward;
    },
  });
}
