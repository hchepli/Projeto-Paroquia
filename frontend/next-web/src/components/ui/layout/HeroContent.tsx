import Button from "@/components/ui/buttons/Button";

interface HeroContentProps {
  eyebrow?: string;
  titleLines: string[];
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryHref?: string;
  secondaryHref?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export default function HeroContent({
  eyebrow,
  titleLines,
  description,
  primaryLabel,
  secondaryLabel,
  primaryHref,
  secondaryHref,
  onPrimaryClick,
  onSecondaryClick,
}: HeroContentProps) {
  return (
    <div className="flex flex-col items-start justify-end gap-2 px-5 sm:px-0">
      {eyebrow && <span className="text-base sm:text-lg tracking-wide">{eyebrow}</span>}
      <h1 className="flex flex-col items-start text-white justify-center gap-1 sm:gap-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[1px] sm:tracking-[2px]">
        {titleLines.map((line, index) => (
          <span key={index}>{line}</span>
        ))}
      </h1>
      <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-medium tracking-wide text-white/80 w-full sm:w-[80%] lg:w-[65%] line-clamp-2">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto">
        {primaryHref ? (
          <Button variant="primary" href={primaryHref}>
            {primaryLabel}
          </Button>
        ) : (
          <Button variant="primary" onClick={onPrimaryClick}>
            {primaryLabel}
          </Button>
        )}
        {secondaryLabel &&
          (secondaryHref ? (
            <Button variant="secondary" href={secondaryHref}>
              {secondaryLabel}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onSecondaryClick}>
              {secondaryLabel}
            </Button>
          ))}
      </div>
    </div>
  );
}