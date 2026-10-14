import { MoveLeft, MoveRight } from "lucide-react";

interface AnnouncementCarouselArrowsProps {
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export default function AnnouncementCarouselArrows({
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
}: AnnouncementCarouselArrowsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Seta de voltar: some/aparece com transição de largura + opacidade */}
      <button
        onClick={onPrevious}
        tabIndex={canGoPrevious ? 0 : -1}
        aria-hidden={!canGoPrevious}
        className={`flex items-center justify-center overflow-hidden rounded-full bg-[#701513] transition-all duration-300 ease-in-out hover:opacity-90 ${
          canGoPrevious
            ? "py-1 px-5 max-w-[80px] opacity-100"
            : "py-1 px-0 max-w-0 opacity-0 pointer-events-none"
        }`}
      >
        <MoveLeft size={32} className="text-white shrink-0" />
      </button>

      {/* Seta de avançar: sempre visível, mas desabilitada quando não há mais páginas */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center justify-center py-1 px-5 rounded-full bg-[#701513] shrink-0 transition-opacity ${
          canGoNext ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"
        }`}
      >
        <MoveRight size={32} className="text-white" />
      </button>
    </div>
  );
}
