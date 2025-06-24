"use client"

import Transactions from '../Transactions';
import { Suspense } from "react";
import BackButton from "@/components/ui/back";




export default function PortfolioPage() {




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
