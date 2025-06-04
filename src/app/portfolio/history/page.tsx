"use client"

import { ArrowDownToLine, ArrowLeft, Download, X } from "lucide-react"

import Transactions from '../Transactions';




export default function PortfolioPage() {




    return (
        <>
            <div className="py-4 bg-[#080d16]">
                <div className="px-7.5">
                    <div
                        onClick={() => history.back()}
                        className="text-light-gray bg-gradient-to-r from-white/10 to-white/5 hover:bg-gradient-to-r hover:from-white/15 hover:to-white/5 cursor-pointer inline-flex p-2 px-2.5 rounded-2xl gap-2 text-sm items-center"
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

        </>
    );
}
