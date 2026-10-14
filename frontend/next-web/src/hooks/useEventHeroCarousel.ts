import { useEffect, useRef, useState } from "react";
import { EventSlide } from "@/types/event/eventSlide";

const SLIDE_DURATION = 6000;
const REVEAL_DELAY_MS = 500;

export function useEventHeroCarousel(slides: EventSlide[]) {
  const n = slides.length;

  const [pos, setPos] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [nextVisible, setNextVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const current = n > 0 ? slides[pos % n] : null;
  const partialCardIndex = pos + 2;
  const trackItems = n > 0 ? [...slides, ...slides] : [];

  // Só arma o timer depois que os slides chegaram (n > 0).
  // Reinicia se `n` mudar (ex: quando o hook de dados resolver).
  useEffect(() => {
    if (n === 0) return;

    timerRef.current = setInterval(() => {
      setWithTransition(true);
      setNextVisible(false);
      setPos((p) => p + 1);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [n]);

  const handleTransitionEnd = () => {
    if (pos >= n) {
      setWithTransition(false);
      setPos(0);
    }
    revealTimeoutRef.current = setTimeout(() => {
      setNextVisible(true);
    }, REVEAL_DELAY_MS);
  };

  const handleIndicatorClick = (i: number) => {
    setWithTransition(true);
    setNextVisible(false);
    setPos(i);
  };

  return {
    n,
    pos,
    current,
    partialCardIndex,
    trackItems,
    withTransition,
    nextVisible,
    handleTransitionEnd,
    handleIndicatorClick,
  };
}