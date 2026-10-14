interface ScheduleItemProps {
  title: string;
  time: string;
}

export default function ScheduleItem({ title, time }: ScheduleItemProps) {
  return (
    <div className="flex justify-between items-center w-full border-b border-black/60 px-3 py-2">
      <p className="text-black">{title}</p>
      <p className="text-black/60 text-sm ml-2">{time}</p>
    </div>
  );
}
