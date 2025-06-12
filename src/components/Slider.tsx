'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  PointerEvent,
} from 'react';

type SliderProps = {
  value: number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;             // 外部额外样式
};

const THUMB_SIZE = 12;            // 直径
const TRACK_HEIGHT = 2;           // 轨道粗细

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function roundToStep(v: number, step: number, min: number) {
  const rounded = Math.round((v - min) / step) * step + min;
  return Number(rounded.toFixed(10)); // 避免浮点误差
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  /* 把像素位置映射成数值 ---------------------------- */
  const pxToValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = ratio * (max - min) + min;
      return roundToStep(raw, step, min);
    },
    [min, max, step, value]
  );

  /* 拖拽事件 ---------------------------------------- */
  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(pxToValue(e.clientX).toString());
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    onChange(pxToValue(e.clientX).toString());
  };

  const handlePointerUp = () => setDragging(false);

  /* 点击轨道直接定位 ------------------------------- */
  const handleTrackClick = (e: PointerEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    onChange(pxToValue(e.clientX).toString());
  };

  /* ------------------------------------------------- */
  const percentage = ((value - min) / (max - min)) * 100;

  /* ⬇︎ 让 thumb 左移半径，使其中心对齐轨道百分比位置 */
  const thumbOffset = `calc(${percentage}% - ${THUMB_SIZE / 2}px)`;

  return (
    <div
      ref={trackRef}
      className={`relative w-full cursor-pointer select-none ${className}`}
      style={{ height: THUMB_SIZE }}
      onPointerDown={handleTrackClick}
    >
      {/* 右侧未填充 */}
      <div
        className="absolute inset-y-1/2 -translate-y-1/2 w-full "
        style={{
          height: TRACK_HEIGHT,
          background: '#FCFCFC1A',
        }}
      />
      {/* 左侧已填充 */}
      <div
        className="absolute inset-y-1/2 -translate-y-1/2 "
        style={{
          width: `${percentage}%`,
          height: TRACK_HEIGHT,
          background: '#2E81FC',
        }}
      />

      {/* Thumb */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: thumbOffset, width: THUMB_SIZE, height: THUMB_SIZE }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'var(--typo-primary, #FCFCFC)',
            border: '4px solid #2E81FC',
          }}
        />
      </div>
    </div>
  );
}
