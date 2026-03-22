import { useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";

export interface SlidesApi {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  getSlideRef: (index: number) => (el: HTMLDivElement | null) => void;
  scrollToSlide: (index: number) => void;
  scrollToPrev: () => void;
  scrollToNext: () => void;
  isFirstSlide: boolean;
  isLastSlide: boolean;
}

interface UseSlidesApiOptions {
  slidesCount: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function useSlidesApi({
  slidesCount,
  currentIndex,
  onIndexChange,
}: UseSlidesApiOptions): SlidesApi {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "y",
    watchDrag: true,
  });

  const isProgrammaticScroll = useRef(false);

  // Sync embla selection -> onIndexChange
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      if (!isProgrammaticScroll.current && index !== currentIndex) {
        onIndexChange(index);
      }
      isProgrammaticScroll.current = false;
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onIndexChange, currentIndex]);

  // Sync external currentIndex -> embla
  useEffect(() => {
    if (!emblaApi) return;
    if (emblaApi.selectedScrollSnap() !== currentIndex) {
      isProgrammaticScroll.current = true;
      emblaApi.scrollTo(currentIndex);
    }
  }, [emblaApi, currentIndex]);

  const scrollToSlide = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      isProgrammaticScroll.current = true;
      emblaApi.scrollTo(index);
      onIndexChange(index);
    },
    [emblaApi, onIndexChange]
  );

  const scrollToPrev = useCallback(() => {
    scrollToSlide(Math.max(currentIndex - 1, 0));
  }, [currentIndex, scrollToSlide]);

  const scrollToNext = useCallback(() => {
    scrollToSlide(Math.min(currentIndex + 1, slidesCount - 1));
  }, [currentIndex, slidesCount, scrollToSlide]);

  const getSlideRef = useCallback(
    (_index: number) => (_el: HTMLDivElement | null) => {},
    []
  );

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === slidesCount - 1;

  return {
    scrollContainerRef: emblaRef as unknown as React.RefObject<HTMLDivElement | null>,
    getSlideRef,
    scrollToSlide,
    scrollToPrev,
    scrollToNext,
    isFirstSlide,
    isLastSlide,
  };
}
