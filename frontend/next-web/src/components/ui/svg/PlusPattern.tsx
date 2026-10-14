interface PlusPatternProps {
  className?: string;
}

export default function PlusPattern({ className }: PlusPatternProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className}>
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <path
            key={`${row}-${col}`}
            d={`M${col * 16 + 8} ${row * 20 + 4} v8 M${col * 16 + 4} ${row * 20 + 8} h8`}
            stroke="black"
            strokeOpacity="0.15"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))
      )}
    </svg>
  );
}
