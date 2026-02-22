import { useCallback, useEffect, useRef, useState } from "react";

interface UseSlidesApiOptions {
  /** Total number of slides */
  slidesCount: number;
  /** Current slide index (controlled externally) */
  currentIndex: number;
  /** Callback when slide index changes */
  onIndexChange: (index: number) => void;
  /** Intersection observer threshold (0-1), default 0.9 */
  threshold?: number;
}

export interface SlidesApi {
  /** Ref to attach to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Function to get ref callback for each slide */
  getSlideRef: (index: number) => (el: HTMLDivElement | null) => void;
  /** Scroll to a specific slide by index */
  scrollToSlide: (index: number) => void;
  /** Scroll to the previous slide */
  scrollToPrev: () => void;
  /** Scroll to the next slide */
  scrollToNext: () => void;
  /** Whether currently at the first slide */
  isFirstSlide: boolean;
  /** Whether currently at the last slide */
  isLastSlide: boolean;
}

export function useSlidesApi({
  slidesCount,
  currentIndex,
  onIndexChange,
  threshold = 0.9,
}: UseSlidesApiOptions): SlidesApi {
  const [targetCurrentIndex, setTargetCurrentIndex] = useState<number | null>(
    null,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to slide by index
  const scrollToSlide = useCallback(
    (index: number) => {
      const slide = slideRefs.current[index];

      if (slide) {
        setTargetCurrentIndex(index);
        slide.scrollIntoView({ behavior: "smooth", block: "start" });
        onIndexChange(index);
      }
    },
    [onIndexChange],
  );

  // Navigate to previous slide
  const scrollToPrev = useCallback(() => {
    scrollToSlide(Math.max(currentIndex - 1, 0));
  }, [currentIndex, scrollToSlide]);

  // Navigate to next slide
  const scrollToNext = useCallback(() => {
    scrollToSlide(Math.min(currentIndex + 1, slidesCount - 1));
  }, [currentIndex, slidesCount, scrollToSlide]);

  // Get ref callback for a specific slide
  const getSlideRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      slideRefs.current[index] = el;
    },
    [],
  );

  // Track scroll position to update current index using Intersection Observer
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting) {
            const index = slideRefs.current.findIndex((ref) => ref === target);

            // Update currentIndex only if not set by scrollToSlide
            if (
              index !== -1 &&
              index !== currentIndex &&
              targetCurrentIndex === null
            ) {
              onIndexChange(index);
            }
            // Clear targetCurrentIndex once we've reached the target
            if (index === targetCurrentIndex) {
              setTargetCurrentIndex(null);
            }
          }
        });
      },
      {
        root: container,
        rootMargin: "0px",
        threshold,
      },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) {
        observer.observe(slide);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [slidesCount, onIndexChange, currentIndex, targetCurrentIndex, threshold]);

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === slidesCount - 1;

  return {
    scrollContainerRef,
    getSlideRef,
    scrollToSlide,
    scrollToPrev,
    scrollToNext,
    isFirstSlide,
    isLastSlide,
  };
}
