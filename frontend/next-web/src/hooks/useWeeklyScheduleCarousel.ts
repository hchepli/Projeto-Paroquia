"use client"

import { useInfiniteCarousel } from "@/hooks/useInfiniteCarousel";
import { useResponsiveWidth } from "@/hooks/useResponsiveWidth";
import { WeeklyMassScheduleDay } from "@/types/event/weeklyMassSchedule";

export function useWeeklyScheduleCarousel(scheduleColumns: WeeklyMassScheduleDay[]) {
  const scheduleTotal = scheduleColumns.length;
  const extendedScheduleColumns =
    scheduleTotal > 0 ? [...scheduleColumns, ...scheduleColumns, ...scheduleColumns] : [];

  const scheduleCardWidth = useResponsiveWidth(
    [
      { maxWidth: 640, value: 260 },
      { maxWidth: 1024, value: 280 },
    ],
    300
  );

  // Precisa bater exatamente com o gap-5 sm:gap-6 lg:gap-7 do ScheduleCarouselTrack
  const scheduleGap = useResponsiveWidth(
    [
      { maxWidth: 640, value: 20 }, // gap-5
      { maxWidth: 1024, value: 24 }, // sm:gap-6
    ],
    28 // lg:gap-7
  );

  const {
    index: scheduleIndex,
    withTransition: scheduleWithTransition,
    handleNext: handleScheduleNext,
    handlePrevious: handleSchedulePrevious,
    handleTransitionEnd: handleScheduleTransitionEnd,
  } = useInfiniteCarousel({ itemCount: scheduleTotal });

  const scheduleStep = scheduleCardWidth + scheduleGap;

  return {
    scheduleTotal,
    extendedScheduleColumns,
    scheduleCardWidth,
    scheduleIndex,
    scheduleWithTransition,
    handleScheduleNext,
    handleSchedulePrevious,
    handleScheduleTransitionEnd,
    scheduleStep,
  };
}