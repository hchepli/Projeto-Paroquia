interface CarouselIndicatorsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function CarouselIndicators({
  count,
  activeIndex,
  onSelect,
  className = "",
}: CarouselIndicatorsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-1.5 rounded-full transition-all ${
            i === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
          }`}
          aria-label={`Ir para slide ${i + 1}`}
        />
      ))}
    </div>
  );
}