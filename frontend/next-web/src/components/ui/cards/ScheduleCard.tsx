import ScheduleItem from "@/components/ui/cards/ScheduleItem";
import { CSSProperties } from "react";

interface ScheduleCardItem {
  title: string;
  time: string;
}

interface ScheduleCardProps {
  day: string;
  items: ScheduleCardItem[];
  style?: CSSProperties;
  className?: string;
}

export default function ScheduleCard({ day, items, style, className = "" }: ScheduleCardProps) {
  return (
    <div
      className={`flex flex-col gap-2 justify-start items-center border border-black rounded-xl min-h-[280px] sm:min-h-[300px] lg:min-h-[325px] ${className}`}
      style={style}
    >
      <div className="flex w-full items-center justify-end border-b border-black p-3">
        <h4 className="text-lg text-black/80">{day}</h4>
      </div>
      <div className="flex w-full flex-col justify-center items-center gap-2">
        {items.map((item, index) => (
          <ScheduleItem key={index} title={item.title} time={item.time} />
        ))}
      </div>
    </div>
  );
}