import React from "react";

interface StripedBarProps {
  count?: number; // 条纹数量
  barWidth?: number; // 每根条纹宽度(px)
  gap?: number; // 条纹间距(px)
  rounded?: boolean; // 是否圆角
  className?: string;
}

const FIXED_WIDTH = 148;
const FIXED_HEIGHT = 16;

const StripedBar: React.FC<StripedBarProps> = ({
  count = 24,
  barWidth = 8,
  gap = 4,
  rounded = true,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ width: `${FIXED_WIDTH}px`, height: `${FIXED_HEIGHT}px` }}
    >
      {Array.from({ length: count }).map((_, i) => {
        // 渐变白色，左侧最透明，右侧全白
        const alpha = i / (count - 1); // 0~1
        const style = {
          backgroundColor: `rgba(255,255,255,${alpha})`,
          width: `${barWidth}px`,
          height: "100%",
          marginLeft: i === 0 ? 0 : `${gap}px`,
          transition: 'background 0.2s',
        };
        return (
          <div
            key={i}
            className={rounded ? "rounded" : ""}
            style={style}
          />
        );
      })}
    </div>
  );
};

export default StripedBar;
