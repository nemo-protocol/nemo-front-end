import React from "react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip"
import Image from "next/image"

interface InfoTooltipProps {
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  description?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  children,
  side = "top",
  description,
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
              src="/assets/images/info.svg"
            />
          </TooltipTrigger>
          {description && (
            <TooltipContent side={side}>{description}</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default InfoTooltip
