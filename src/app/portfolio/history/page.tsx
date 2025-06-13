"use client"

import { ArrowDownToLine, ArrowLeft, Download, X } from "lucide-react"

import Transactions from '../Transactions';
import { Suspense } from "react";




export default function PortfolioPage() {




    return (
        <Suspense>
            <div className="py-4 min-h-screen bg-[#080d16]">
                <div className="px-7.5">
                    <div
                        onClick={() => history.back()}
                        className="text-light-gray bg-gradient-to-r from-white/5 to-white/2 hover:bg-gradient-to-r  hover:from-white/8 transition-all duration-200 hover:to-white/4  cursor-pointer inline-flex p-1 px-2.5 rounded-2xl gap-2 text-sm items-center"
                    >
                        <ArrowLeft width={16} />
                        <span className="text-sm">Back</span>
                    </div>
                    <div className="text-[32px] mt-6 font-normal font-serif font-[470] text-[#FCFCFC]">
                        {" Transaction history"}
                    </div>
                </div>
                <Transactions />

            </div>

        </Suspense>
    );
}
