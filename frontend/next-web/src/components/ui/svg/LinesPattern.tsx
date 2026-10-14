interface LinesPatternProps {
  className?: string;
}

export default function LinesPattern({ className }: LinesPatternProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className}>
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={i}
          x1={i * 14}
          y1="60"
          x2={i * 14 + 24}
          y2="0"
          stroke="black"
          strokeOpacity="0.15"
          strokeWidth="5"
        />
      ))}
    </svg>
  );
}
