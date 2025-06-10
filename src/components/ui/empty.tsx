import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';

type EmptyDataProps = {
    text?: string;
    icon?: React.ReactNode;
    height?: number | string;
    className?: string;
};

export default function EmptyData({
    text = 'No Data',
    icon,
    height = 160,
    className,
}: EmptyDataProps) {
    return (
        <div
            style={{ height }}
            className={clsx(
                'flex w-full flex-col items-center justify-center text-gray-500',
                className,
            )}
        >
            {/* 图标 */}
            <span className="text-[18px] font-[500] mb-2 opacity-60">
                {<Image
                    src={"/empty.svg"}
                    alt={""}
                    width={36}
                    height={36}
                    className="shrink-0 mt-1.5"
                />}
            </span>
            {/* 文案 */}
            <span className="text-sm opacity-60">{text}</span>
        </div>
    );
}
