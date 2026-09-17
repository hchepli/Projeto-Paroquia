// src/components/ui/cards/Card.tsx
import { LucideIcon, ChevronRight } from 'lucide-react';

interface CardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  description?: string;
  badge?: string;
  badgeColor?: 'green' | 'red' | 'yellow' | 'blue';
  onClick?: () => void;
  active?: boolean;
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
  onClick,
  active = false,
}: CardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      className={`relative flex flex-col gap-2 p-4 rounded-[16px] border w-full ${
        isInteractive ? 'cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.02)]' : ''
      } ${active ? 'border-[rgba(0,0,0,0.6)]' : 'border-[rgba(0,0,0,0.3)]'}`}
    >
      {isInteractive && (
        <span className="absolute top-4 right-4 flex items-center gap-0.5 text-xs font-medium text-[rgba(0,0,0,0.5)] whitespace-nowrap">
          Ver Mais
          <ChevronRight width={14} />
        </span>
      )}

      <div className="flex justify-start items-center gap-2">
        <div className="w-6 h-6 rounded-sm flex justify-center items-center bg-[rgba(0,0,0,0.05)]">
          <Icon width={16} />
        </div>
        <p className="font-normal text-[rgba(0,0,0,0.5)]">{title}</p>
      </div>

      <div className="flex justify-between items-center w-full gap-3">
        <h5 className="font-medium text-4xl">{value}</h5>
        <div className="w-[62px] h-[62px] rounded-full flex justify-center items-center border border-[rgba(0,0,0,0.3)] shrink-0">
          <Icon width={28} />
        </div>
      </div>

      <div className="flex justify-start items-center gap-2 min-h-[24px]">
        {badge ? (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full text-[rgba(0,0,0,0.8)] ${badgeColors[badgeColor]}`}
          >
            {badge}
          </span>
        ) : description ? (
          <p className="font-normal text-sm text-[rgba(0,0,0,0.5)]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}