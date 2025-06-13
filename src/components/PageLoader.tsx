// PageLoader.tsx
import { useEffect, useState } from 'react';

export default function PageLoader() {
            // 加载完毕后不再渲染

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <video
        className="w-28 h-28"          /* 按设计调大小 */
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/assets/pearl_single.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
