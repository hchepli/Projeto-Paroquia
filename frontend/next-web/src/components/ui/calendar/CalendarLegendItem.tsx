interface CalendarLegendItemProps {
  color: string;
  label: string;
}

export default function CalendarLegendItem({ color, label }: CalendarLegendItemProps) {
  return (
    <div className="relative flex items-center gap-3 w-full sm:w-56 lg:w-72">
      <span
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 z-10"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute left-4 sm:left-5 right-0 top-1/2 -translate-y-1/2 h-[2px]"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative z-10 bg-white text-sm font-medium text-black rounded-full px-4 py-1 whitespace-nowrap border"
        style={{ borderColor: color }}
      >
        {label}
      </span>
    </div>
  );
}
