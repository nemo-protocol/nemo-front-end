"use client"
import { ArrowDownToLine, Download, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { network } from "@/config"

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';;
import Image from 'next/image';
import Assets, { isExpired } from './Assets';
import Transactions from './Transactions';
import { usePortfolioList } from '@/queries';
import useAllPyPositions from '@/hooks/fetch/useAllPyPositions';
import useAllLpPositions from '@/hooks/fetch/useAllLpPositions';
import useMultiMarketState from "@/hooks/query/useMultiMarketState"

import { formatTVL, isValidAmount } from '@/lib/utils';
import { useParams } from 'next/navigation';
import useCoinData from '@/hooks/query/useCoinData';
import { useWallet } from '@nemoprotocol/wallet-kit';
import useQueryClaimAllLpReward from '@/hooks/useQueryClaimAllLpReward';
import useQueryClaimAllYtReward from '@/hooks/dryRun/useQueryClaimAllYtReward';
import { Transaction } from "@mysten/sui/transactions";
import { signAndExecuteTransaction } from "@mysten/wallet-standard";
import useClaimAllReward from "@/hooks/dryRun/useClaimAllReward";
import Decimal from "decimal.js";
import UnclaimedRewardModal from "./ClaimReward";
import { NO_SUPPORT_YT_COINS } from "@/lib/constants";
import { showTransactionDialog } from "@/lib/dialog";


export default function PortfolioPage() {

    const { data: list, isLoading } = usePortfolioList()
    const { type } = useParams()
    const { address } = useWallet()
    const [loading, setLoading] = useState(true)
    const [claimLoading, setClaimLoading] = useState(true)

    const [balance, setBalance] = useState("0")
    const [totalClaim, setTotalClaim] = useState("0")
    const [open, setOpen] = useState(false);
    const selectType = useMemo(() => {
        if (type && ["pt", "yt", "lp"].includes(type as string)) {
            return type as "pt" | "yt" | "lp"
        }
        return "pt"
    }, [type])
    const { data: pyPositionsMap = {}, isLoading: isPositionsLoading } =
        useAllPyPositions(list)
    const { data: lpPositionsMap = {}, isLoading: isLpPositionsLoading } =
        useAllLpPositions(list)

    const marketStateIds = useMemo(
        () => list?.map((item) => item.marketStateId).filter(Boolean) || [],
        [list],
    )
    const { data: marketStates = {}, isLoading: isMarketStatesLoading } =
        useMultiMarketState(marketStateIds)

    const filteredLists = useMemo(() => {
        if (!list?.length) return { pt: [], yt: [], lp: [] }

        return {
            pt: list.filter((item) => {
                // FIXME: get multi pt coin info
                return (
                    (
                        // !!item.ptTokenType ||
                        isValidAmount(pyPositionsMap[item.id]?.ptBalance)) && address
                )
            }),
            yt: list.filter((item) => {
                return (isValidAmount(pyPositionsMap[item.id]?.ytBalance) && (!NO_SUPPORT_YT_COINS.includes(item?.coinType) || !isExpired(item.maturity)))
            },
            ),
            lp: list.filter((item) =>
                isValidAmount(lpPositionsMap[item.id]?.lpBalance),
            ),
        }
    }, [list, pyPositionsMap, lpPositionsMap])



    const {
        data: ytReward,
        isLoading: isClaimLoading,
        refetch: refetchYtReward,
    } = useQueryClaimAllYtReward({
        filteredYTLists: filteredLists.yt,
        pyPositionsMap,
    })
    // if (ytReward)
    //     for (const key in pyPositionsMap) {
    //         if (ytReward[key]) {
    //             pyPositionsMap[key].ytBalance = ytReward[key];
    //         }
    //     }

    const {
        data: lpReward,
        refetch: refetchLpReward,
        isLoading: isLpRewardLoading,
    } = useQueryClaimAllLpReward({
        filteredLPLists: filteredLists.lp,
        lpPositionsMap,
        marketStates,
    })
    const { mutateAsync: claimAllReward } = useClaimAllReward()

    const claimAllandAddLiqudity = async () => {
        setClaimLoading(false)
        try {
            console.log(ytReward, 'sixu1')

            if (ytReward) {
                const digest = await claimAllReward({
                    filteredYTLists: filteredLists.yt,
                    filteredLPLists: filteredLists.lp,
                    pyPositionsMap,
                    addLiqudity: false,
                    ytReward,
                    lpPositionsMap,
                    marketStates
                })
                setOpen(false)

                showTransactionDialog({
                    status: "Success",
                    network,
                    txId: digest,
                    onClose: async () => {
                        refetchYtReward()
                        refetchLpReward()
                    },
                })
                setClaimLoading(true)

            }
        } catch (error) {
            setClaimLoading(true)
        }


    }

    useEffect(() => {

        if (address && marketStates && pyPositionsMap && filteredLists) {

            let _balance = new Decimal(0)
            let _totalClaim = new Decimal(0)
            filteredLists.pt.forEach((item) => {
                _balance = _balance.add(new Decimal(pyPositionsMap?.[item?.id]?.ptBalance || 0).mul(item.ptPrice) || 0)
            })
            filteredLists.yt.forEach((item) => {
                _balance = _balance.add(new Decimal(pyPositionsMap[item.id]?.ytBalance || 0).mul(item.ytPrice) || 0)
                ytReward && (_totalClaim = _totalClaim.add(new Decimal(ytReward?.[item.id] || 0).mul(item.underlyingPrice)))
            })
            filteredLists.lp.forEach((item) => {
                _balance = _balance.add(new Decimal(lpPositionsMap[item.id]?.lpBalance || 0).mul(item.lpPrice) || 0)
                lpReward && (marketStates[item.marketStateId]?.rewardMetrics.forEach(rewardMetric => {

                    _totalClaim = _totalClaim.add(new Decimal(lpReward[item.id + rewardMetric.tokenName]).mul(rewardMetric.tokenPrice))
                }))
            })
            setBalance(_balance.toString())
            setTotalClaim(_totalClaim.toString())
            !isLoading && setLoading(false)
        }
        else if (!address) {
            !isLoading && setLoading(false)
            setBalance("0")
            setTotalClaim("0")
        }
    }, [lpReward, ytReward, filteredLists, address])

    return (
        <>
            <div className="py-4 bg-[#080d16]">
                <h1 className="text-[32px] w-full flex justify-center gap-2 items-start font-normal font-serif font-[470] text-[#FCFCFC]">My Portfolio
                    <Image
                        src={"/folder-open.svg"}
                        alt={""}
                        width={16}
                        height={16}
                        className="shrink-0 mt-1.5"
                    /></h1>
                <div className="mt-12">
                    <div className="grid grid-cols-2">
                        <div className="flex flex-col h-[182px] items-center">
                            <div className="text-[12px] font-[600] text-[#FCFCFC66]">Balance</div>
                            {(loading) ? <div className="w-[290px] font-[470] h-[36px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4"></div> : <div className="text-[56px] font-serif font-Medium font-[470] text-[#FCFCFC]">{formatTVL(balance)}</div>}
                        </div>
                        <div className="flex flex-col h-[182px] items-center">
                            <div className="text-[12px] font-[600] text-[#FCFCFC66]">Total Claimable Yield</div>
                            {(loading) ? <div className="w-[290px] font-[470] h-[36px] rounded-[15px] bg-gradient-to-r from-[rgba(38,48,66,0.5)] to-[rgba(15,23,33,0.5)] mt-4"></div> : <><div className="text-[56px] font-serif font-Medium text-[#FCFCFC]">{formatTVL(totalClaim)}</div>
                                <div>
                                    <div className="text-[12px] font-[500] text-[#FCFCFC66] flex
                              transition-colors duration-200
                             cursor-pointer hover:text-white hover:bg-[rgba(252,252,252,0.10)] gap-2 px-4 py-2.5 items-center rounded-[24px]" onClick={() => setOpen(true)}>
                                        <Download className="w-4 h-4" />Claim ALL
                                    </div>
                                </div>
                            </>
                            }
                        </div>
                    </div>
                </div>
                <Assets
                    pyPositionsMap={pyPositionsMap}
                    marketStates={marketStates}
                    lpPositionsMap={lpPositionsMap}
                    filteredLists={filteredLists}
                    ytReward={ytReward}
                    lpReward={lpReward}
                    loading={isLpPositionsLoading || isMarketStatesLoading || isPositionsLoading || isLoading}
                />
                <Transactions />
                <UnclaimedRewardModal
                    open={open}
                    pyPositionsMap={pyPositionsMap}
                    marketStates={marketStates}
                    lpPositionsMap={lpPositionsMap}
                    filteredLists={filteredLists}
                    ytReward={ytReward}
                    lpReward={lpReward}
                    onClose={() => setOpen(false)}
                    onClaimAll={claimAllandAddLiqudity}
                    claimLoading={claimLoading}
                />
            </div>

        </>
    );
}
