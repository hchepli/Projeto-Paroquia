import { CSSProperties } from "react";
import EventCard from "../cards/EventCard";

interface CarouselTrackItem {
  slug: string;
  image: string;
  cardTitle: string;
  cardDescription: string;
}

interface EventCarouselTrackProps {
  items: CarouselTrackItem[];
  translateX: number;
  withTransition: boolean;
  transitionMs: number;
  partialCardIndex?: number;
  nextVisible?: boolean;
  fadeMs?: number;
  onTransitionEnd?: () => void;
  windowWidth: number | string;
  imageOnly?: boolean;
  cardWidth: number;
  cardHeight?: number;
  gap: number;
}

export function EventCarouselTrack({
  items,
  translateX,
  withTransition,
  transitionMs,
  partialCardIndex,
  nextVisible,
  fadeMs = 300,
  onTransitionEnd,
  windowWidth,
  imageOnly = false,
  cardWidth,
  cardHeight,
  gap,
}: EventCarouselTrackProps) {
  return (
    <div
      className={
        imageOnly
          ? "absolute top-[-40dvh] md:top-[-30dvh] right-0 overflow-hidden"
          : "absolute bottom-20 right-0 overflow-hidden"
      }
      style={{ width: windowWidth }}
    >
      <div
        className="flex items-center"
        style={{
          gap,
          transform: `translateX(-${translateX}px)`,
          transition: withTransition ? `transform ${transitionMs}ms ease` : "none",
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {items.map((slide, i) => {
          const style: CSSProperties | undefined =
            i === partialCardIndex
              ? { opacity: nextVisible ? 1 : 0, transition: `opacity ${fadeMs}ms ease` }
              : undefined;

          return (
            <EventCard
              key={i}
              image={slide.image}
              title={slide.cardTitle}
              description={slide.cardDescription}
              href={`/eventos/${slide.slug}`}
              imageOnly={imageOnly}
              width={imageOnly ? cardWidth : undefined}
              height={imageOnly ? cardHeight : undefined}
              className={imageOnly ? "" : "w-[350px]"}
              style={style}
            />
          );
        })}
      </div>
    </div>
  );
}