import { ReactNode } from "react";
import PlusPattern from "../svg/PlusPattern";
import LinesPattern from "../svg/LinesPattern";

interface PatternedPanelProps {
  children: ReactNode;
  className?: string;
}

export function PatternedPanel({ children, className = "" }: PatternedPanelProps) {
  return (
    <div
      className={`relative flex flex-col justify-between items-center gap-8 lg:gap-0 bg-[#F8F8F8] rounded-xl w-full overflow-hidden`}
    >
      <div className="flex justify-between items-center w-full mb-7">
      <PlusPattern className=" w-28 sm:w-40 lg:w-60 rotate-180" />
      <LinesPattern className=" w-28 sm:w-40 lg:w-60" />
      </div>
      <div className={`w-full h-full ${className}`}>{children}</div>
            <div className="flex justify-between items-center w-full mt-7">
      <LinesPattern className=" w-28 sm:w-40 lg:w-60" />
      <PlusPattern className=" w-28 sm:w-40 lg:w-60 rotate-180" />
      </div>
    </div>
  );
}