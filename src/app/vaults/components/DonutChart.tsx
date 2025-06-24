'use client'
export default function DonutChart() {
  return (
    <div className="relative w-[120px] h-[120px]">
      <svg viewBox="0 0 42 42" className="w-full h-full rotate-[-90deg]">
        {/* 背景圆环 */}
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#1f2933"
          strokeWidth="6"
        />
        {/* suiUSDT 47.33% */}
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#4E6BFF"
          strokeWidth="6"
          strokeDasharray="47.33 52.67"
          strokeDashoffset="0"
        />
      </svg>
    </div>
  )
}