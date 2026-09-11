import { LucideIcon } from 'lucide-react';

interface CardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  badge?: string;
  badgeColor?: 'green' | 'red' | 'yellow' | 'blue';
}

const badgeColors: Record<NonNullable<CardProps['badgeColor']>, string> = {
  green: 'bg-green-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
  blue: 'bg-blue-100',
};

export default function Card({
  icon: Icon,
  title,
  value,
  description,
  badge,
  badgeColor = 'blue',
}: CardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-[16px] border border-[rgba(0,0,0,0.3)] w-full">
      <div className="flex justify-start items-center gap-2">
        <div className="w-6 h-6 rounded-sm flex justify-center items-center bg-[rgba(0,0,0,0.05)]">
          <Icon width={16} />
        </div>
        <p className="font-normal text-[rgba(0,0,0,0.5)]">{title}</p>
      </div>

      <div className="flex justify-between items-center w-full gap-3">
        <h5 className="font-medium text-4xl">{value}</h5>
        <div className="w-[62px] h-[62px] rounded-full flex justify-center items-center border border-[rgba(0,0,0,0.3)]">
          <Icon width={28} />
        </div>
      </div>

      <div className="flex justify-start items-center gap-2">
        {badge ? (
          <span className={`text-xs font-medium px-2 py-1 rounded-full text-[rgba(0,0,0,0.8)] ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        ) : description ? (
          <p className="font-normal text-sm text-[rgba(0,0,0,0.5)]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}