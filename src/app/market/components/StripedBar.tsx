import React from "react"

interface StripedBarProps {
  count?: number // 条纹数量
  barWidth?: number // 每根条纹宽度(px)
  gap?: number // 条纹间距(px)
  rounded?: boolean // 是否圆角
  className?: string
  activeCount: number // 高亮条数
}

const FIXED_WIDTH = 148
const FIXED_HEIGHT = 16

const StripedBar: React.FC<StripedBarProps> = ({
  count = 24,
  barWidth = 8,
  gap = 4,
  rounded = true,
  className = "",
  activeCount,
}) => {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ width: `${FIXED_WIDTH}px`, height: `${FIXED_HEIGHT}px` }}
    >
      {Array.from({ length: count }).map((_, i) => {
        let style
        if (i < activeCount) {
          // Adjust the brightness range according to the progress bar fill ratio
          const fillRatio = activeCount / count
          let alpha
          let minAlpha, maxAlpha

          if (fillRatio < 0.5) {
            // When it is less than 1/2, the brightness is from 0.5-1
            minAlpha = 0.5
            maxAlpha = 1
          } else {
            // When it is greater than 1/2, the brightness is from 0.25-1
            minAlpha = 0.25
            maxAlpha = 1
          }

          if (activeCount === 1) {
            alpha = maxAlpha
          } else {
            alpha = minAlpha + (i / (activeCount - 1)) * (maxAlpha - minAlpha)
          }

          style = {
            backgroundColor: `rgba(255,255,255,${alpha})`,
            width: `${barWidth}px`,
            height: "100%",
            marginLeft: i === 0 ? 0 : `${gap}px`,
            transition: "background 0.2s",
          }
        } else {
          style = {
            backgroundColor: "rgba(252,252,252,0.10)", // bg-gray-light/10
            width: `${barWidth}px`,
            height: "100%",
            marginLeft: i === 0 ? 0 : `${gap}px`,
            transition: "background 0.2s",
          }
        }
        return (
          <div key={i} style={style} className={rounded ? "rounded" : ""} />
        )
      })}
    </div>
  )
}

export default StripedBar
