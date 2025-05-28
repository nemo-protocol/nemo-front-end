"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"

import { useMemo, useState } from 'react';;
import Image from 'next/image';
import Assets from './Assets';
import Transactions from './Transactions';
import { usePortfolioList } from '@/queries';
import useAllPyPositions from '@/hooks/fetch/useAllPyPositions';
import useAllLpPositions from '@/hooks/fetch/useAllLpPositions';
import useMultiMarketState from "@/hooks/query/useMultiMarketState"

import { isValidAmount } from '@/lib/utils';
import { useParams } from 'next/navigation';
import useCoinData from '@/hooks/query/useCoinData';
import { useWallet } from '@nemoprotocol/wallet-kit';
import useQueryClaimAllLpReward from '@/hooks/useQueryClaimAllLpReward';
import useQueryClaimAllYtReward from '@/hooks/dryRun/useQueryClaimAllYtReward';


export default function PortfolioPage() {

    const { data: list, isLoading } = usePortfolioList()
    const { type } = useParams()
    const { address } = useWallet()

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
                    !!item.ptTokenType ||
                    isValidAmount(pyPositionsMap[item.id]?.ptBalance)
                )
            }),
            yt: list.filter((item) =>
                isValidAmount(pyPositionsMap[item.id]?.ytBalance),
            ),
            lp: list.filter((item) =>
                isValidAmount(lpPositionsMap[item.id]?.lpBalance),
            ),
        }
    }, [list, pyPositionsMap, lpPositionsMap])
    const filteredList = useMemo(() => {
        return filteredLists[selectType] || []
    }, [filteredLists, selectType])

    // const { data: marketStates = {}, isLoading: isMarketStatesLoading } =
    //     useMultiMarketState(marketStateIds)


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
    console.log(pyPositionsMap, 'sixu')
    const {
        data: lpReward,
        refetch: refetchLpReward,
        isLoading: isLpRewardLoading,
    } = useQueryClaimAllLpReward({
        filteredLPLists: filteredLists.lp,
        lpPositionsMap,
        marketStates,
    })

    // console.log(pyPositionsMap, filteredLists.yt, 'sixu')

    return (
        <>
            <div className="py-4 bg-[#080d16]">
                <h1 className="text-[32px] w-full flex justify-center font-normal font-serif font-[470] text-[#FCFCFC]">My Portfolio</h1>
                <div className="mt-12">
                    <div className="grid grid-cols-2">
                        <div className="flex flex-col h-[182px] justify-center items-center">
                            <div className="text-[12px] font-[650] text-[#FCFCFC66]">Balance</div>
                            <div className="text-[56px] font-serif font-normal font-[470] text-[#FCFCFC]">${100200.12.toFixed(2)}</div>
                        </div>
                        <div className="flex flex-col h-[182px] justify-center items-center">
                            <div className="text-[12px] font-[650] text-[#FCFCFC66]">Total Claimable Yield</div>
                            <div className="text-[56px] font-serif font-normal font-[470] text-[#FCFCFC]">${400.22.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <Assets pyPositionsMap={pyPositionsMap} marketStates={marketStates} lpPositionsMap={lpPositionsMap} filteredLists={filteredLists}/>
                <Transactions />

            </div>

        </>
    );
}
