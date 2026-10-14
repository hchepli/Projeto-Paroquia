import { useEffect, useState } from "react";

interface UseInfiniteCarouselOptions {
  itemCount: number;
}

export function useInfiniteCarousel({ itemCount }: UseInfiniteCarouselOptions) {
  const [index, setIndex] = useState(itemCount);
  const [withTransition, setWithTransition] = useState(true);

  // Ressincroniza o índice sempre que itemCount mudar (ex: 0 -> 7 quando o mock/API resolve).
  useEffect(() => {
    setWithTransition(false);
    setIndex(itemCount);
  }, [itemCount]);

  const handleNext = () => {
    setWithTransition(true);
    setIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setWithTransition(true);
    setIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (index >= itemCount * 2) {
      setWithTransition(false);
      setIndex(index - itemCount);
    } else if (index < itemCount) {
      setWithTransition(false);
      setIndex(index + itemCount);
    }
  };

  return { index, withTransition, handleNext, handlePrevious, handleTransitionEnd };
}