import Button from "@/components/ui/buttons/Button";

interface FundraisingCardProps {
  title: string;
  description: string;
  currentAmount: number;
  goalAmount: number;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FundraisingCard({
  title,
  description,
  currentAmount,
  goalAmount,
  buttonLabel = "Quero ajudar",
  onButtonClick,
}: FundraisingCardProps) {
  const progress = Math.min(100, Math.round((currentAmount / goalAmount) * 100));

  return (
    <div className="w-full border border-gray-200 rounded-2xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <span className="text-base sm:text-xl font-semibold text-black">{title}</span>
      <p className="text-sm sm:text-lg text-black/60 w-full sm:w-[65%] leading-[1.2]">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3 w-full">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm sm:text-lg font-bold text-[#206D0D]">
              {formatCurrency(currentAmount)}
            </span>
            <span className="text-xs sm:text-sm font-normal text-gray-400">
              / {formatCurrency(goalAmount)}
            </span>
          </div>
          <div className="w-full h-4 sm:h-6 bg-[#55D835] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#206D0D] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Button size="sm" icon onClick={onButtonClick}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
