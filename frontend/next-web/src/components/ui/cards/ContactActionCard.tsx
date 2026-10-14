import Button from "@/components/ui/buttons/Button";
import { ContactAction } from "@/types/institutional/contactAction";

interface ContactActionCardProps {
  action: ContactAction;
  onButtonClick?: () => void;
}

export default function ContactActionCard({ action, onButtonClick }: ContactActionCardProps) {
  return (
    <div className="w-full border border-gray-200 rounded-2xl p-6 sm:p-7 flex flex-col gap-4 sm:gap-5">
      <span className="text-lg sm:text-2xl font-semibold text-black">{action.title}</span>
      <p className="text-base sm:text-lg text-black/50 leading-[1.3]">{action.description}</p>
      <Button size="sm" icon onClick={onButtonClick} className="self-start py-2.5 px-5 text-base">
        {action.buttonLabel}
      </Button>
    </div>
  );
}