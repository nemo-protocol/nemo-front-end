import React from "react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip"
import Image from "next/image"

interface InfoTooltipProps {
  active?: boolean
  children: React.ReactNode
  content?: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  children,
  side = "top",
  active = true,
}) => {
  return (
    <div className="relative">
      {children}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            asChild
            className="absolute top-0 -right-4 cursor-pointer"
          >
            <Image
              alt="info"
              width={16}
              height={16}
              style={{ color: "#fff" }}
              src={
                active
                  ? "/assets/images/info.svg"
                  : "/assets/images/info-inactive.svg"
              }
            />
          </TooltipTrigger>
          {content && (
            <TooltipContent
              side={side}
              className="border border-line-gray px-2.5 py-4.5 rounded-xl bg-dark-gray"
            >
              {content}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default InfoTooltip
