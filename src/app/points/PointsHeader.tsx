import Image from "next/image";

export default function PointsHeader() {
  return (
    <div className="py-4 bg-[#080d16]">
      <h1 className="text-[32px] w-full flex justify-center gap-2 items-start font-normal font-serif font-[470] text-[#FCFCFC]">
        Points Markets
        <Image
          src={"/star-open.svg"}
          alt={""}
          width={16}
          height={16}
          className="shrink-0 mt-1.5"
        />
      </h1>
      <p className="text-light-gray/40 text-[16px] w-full flex justify-center mt-3">
        Unlock limitless potential with Nemo points markets, YT holders can maximize points exposure
      </p>
    </div>
  );
}