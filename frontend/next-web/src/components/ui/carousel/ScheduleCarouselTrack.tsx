import { ReactNode } from "react";

interface ScheduleCarouselTrackProps {
  index: number;
  step: number;
  withTransition: boolean;
  onTransitionEnd: () => void;
  className?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export function ScheduleCarouselTrack({
  index,
  step,
  withTransition,
  onTransitionEnd,
  className = "",
  wrapperClassName = "",
  children,
}: ScheduleCarouselTrackProps) {
  return (
    <div className={`w-full overflow-hidden ${wrapperClassName}`}>
      <div
        className={`flex gap-5 sm:gap-6 lg:gap-7 ${
          withTransition ? "transition-transform duration-300 ease-in-out" : ""
        } ${className}`}
        style={{ transform: `translateX(-${index * step}px)` }}
        onTransitionEnd={onTransitionEnd}
      >
        {children}
      </div>
    </div>
  );
}