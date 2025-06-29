"use client"

import BackButton from "@/components/ui/back";
import {ArrowLeft} from "lucide-react"

import Image from 'next/image';
import Transactions from '../Transactions';
import { Suspense } from "react";
import { getIsMobile } from "@/lib/utils";
import MobileTransactions from "../MobileTransactions";




export default function PortfolioPage() {
    const isMobile = getIsMobile()

    if (isMobile) {
        return (
            <Suspense>
                <div className="py-8 px-[15px] min-h-screen bg-[#080d16] font-serif">
                    <div className="flex flex-col justify-center items-start self-stretch">
                        <div
                            onClick={() => history.back()}
                            className="flex h-[34px] px-[10px] py-2 justify-center items-center gap-2 rounded-[999px] bg-[rgba(252,252,252,0.03)] backdrop-blur-[10px] text-[#FCFCFC] text-[14px] font-[550] leading-[120%] cursor-pointer"
                        >
                            <ArrowLeft width={16} />
                            <span>Back</span>
                        </div>
                    </div>
                    <div className="flex items-start justify-center gap-1 mt-12 text-[32px] font-[470] text-[#FCFCFC] text-center leading-[100%] tracking-[-1.28px]" style={{ textShadow: '0px 0px 32px rgba(239, 244, 252, 0.56)' }}>
                        <span>Transaction history</span>
                        <Image
                            src="/protfolio/calendar.svg"
                            alt=""
                            width={16}
                            height={16}
                        />
                    </div>
                    <MobileTransactions isMobileHistory={true} />

                </div>
            </Suspense>
        )
    }

    return (
        <Suspense>
            <div className="py-4 min-h-screen bg-[#080d16]">
                <div className="px-7.5">
                    <BackButton />
                    <div className="text-[32px] mt-6 font-normal font-serif font-[470] text-[#FCFCFC]">
                        {" Transaction history"}
                    </div>
                </div>
                <Transactions />

            </div>

        </Suspense>
    );
}
