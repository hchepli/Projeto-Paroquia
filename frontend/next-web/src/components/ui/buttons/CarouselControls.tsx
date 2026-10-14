import { ArrowLeft, ArrowRight } from "lucide-react";

interface CarouselControlsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  size?: number;
}

export default function CarouselControls({
  onPrevious,
  onNext,
  size = 20,
}: CarouselControlsProps) {
  return (
    <div className="flex justify-center items-center gap-2">
      <button
        onClick={onPrevious}
        className="flex justify-center items-center p-2 rounded-full bg-black"
      >
        <ArrowLeft size={size} className="text-white" />
      </button>
      <button
        onClick={onNext}
        className="flex justify-center items-center p-2 rounded-full bg-black"
      >
        <ArrowRight size={size} className="text-white" />
      </button>
    </div>
  );
}
