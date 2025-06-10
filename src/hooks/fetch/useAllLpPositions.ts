import { useMemo } from "react";
import Decimal from "decimal.js";
import { useWallet } from "@nemoprotocol/wallet-kit";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { PortfolioItem } from "@/queries/types/market";
import { LpPosition } from "../types";
import { useSearchParams } from "next/navigation";     

const useAllLpPositions = (items?: PortfolioItem[]) => {
  const { address } = useWallet();

  const searchParams   = useSearchParams();
  const mockAddressRaw = searchParams.get("mockAddress");     

 

  const effectiveAddress = useMemo(() => {
    const shouldMock = process.env.NODE_ENV !== "production" && mockAddressRaw;
    return shouldMock ? mockAddressRaw! : address;
  }, [address, mockAddressRaw]);

  const allPositionTypes = useMemo(() => {
    if (!items) return [];
    return Array.from(
      new Set(
        items
          .flatMap((item) =>
            item.marketPositionTypeList || [item.marketPositionType],
          )
          .filter(Boolean),
      ),
    );
  }, [items]);

  /* 4. 调 suiClient，注意 owner / queryKey / enabled 都换成 effectiveAddress */
  return useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: effectiveAddress!,                         
      filter: {
        MatchAny: allPositionTypes.map((type: string) => ({
          StructType: type,
        })),
      },
      options: { showContent: true },
    },
    {
      queryKey: ["queryAllLpPositionData", effectiveAddress, allPositionTypes],
      gcTime: 10_000,
      enabled: !!effectiveAddress && allPositionTypes.length > 0,
      select: (data) => {
        const positions = data.data
          .map(
            (item) =>
              (
                item.data?.content as {
                  fields?: LpPosition;
                }
              )?.fields,
          )
          .filter((p): p is LpPosition => p !== undefined)

        if (!items) return {};

        return items.reduce(
          (acc, item) => {
            const decimal     = Number(item.decimal);
            const lpPositions = positions.filter(
              (position) =>
                (!item.maturity ||
                  position.expiry === item.maturity.toString()) &&
                (!item.marketStateId ||
                  position.market_state_id === item.marketStateId),
            );

            const lpBalance = lpPositions
              .reduce(
                (tot, coin) => tot.add(coin.lp_amount),
                new Decimal(0),
              )
              .div(10 ** decimal)
              .toFixed(decimal);

            acc[item.id] = { lpBalance, lpPositions };
            return acc;
          },
          {} as Record<string, { lpBalance: string; lpPositions: LpPosition[] }>,
        );
      },
    },
  );
};

export default useAllLpPositions;
