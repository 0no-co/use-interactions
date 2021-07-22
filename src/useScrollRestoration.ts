import { useLayoutEffect } from './utils/react';
import { observeScrollArea } from './utils/observeScrollArea';
import { Ref } from './types';

const getIdForState = (state?: {} | null): string =>
  `${state ? JSON.stringify(state) : ''}${document.location}`;

const scrollPositions: Record<string, [number, number]> = {};

export function useScrollRestoration<T extends HTMLElement>(
  ref: 'window' | Ref<T>
) {
  useLayoutEffect(() => {
    let unsubscribe: void | (() => void);
    if (ref !== 'window' && !ref.current) return;

    const addonId = ref === 'window' ? 'window' : ref.current!.id || '';
    const eventTarget = ref === 'window' ? window : ref.current!;
    const scrollTarget = ref === 'window' ? document.body : ref.current!;

    function restoreScroll(event?: PopStateEvent) {
      const id = addonId + getIdForState(event ? event.state : history.state);
      const { scrollWidth, scrollHeight } = scrollTarget;
      const scrollTo = scrollPositions[id];
      if (!scrollTo) {
        // noop
      } else if (scrollWidth >= scrollTo[0] && scrollHeight >= scrollTo[1]) {
        scrollTarget.scrollTo(scrollTo[0], scrollTo[1]);
      } else {
        if (unsubscribe) unsubscribe();
        unsubscribe = observeScrollArea(
          ref === 'window' ? document.body : ref.current!,
          (scrollWidth: number, scrollHeight: number) => {
            // check whether the scroll position has already moved too far
            const halfViewportX = window.innerWidth / 2;
            const halfViewportY = window.innerHeight / 2;
            const newScrollTo = scrollPositions[id];
            const hasMoved =
              Math.abs(scrollTo[0] - newScrollTo[0]) > halfViewportX ||
              Math.abs(scrollTo[1] - newScrollTo[1]) > halfViewportY;
            // then we restore the position as it's now possible
            if (
              hasMoved ||
              (scrollWidth >= scrollTo[0] && scrollHeight >= scrollTo[1])
            ) {
              if (!hasMoved) scrollTarget.scrollTo(scrollTo[0], scrollTo[1]);
              if (unsubscribe) unsubscribe();
            }
          }
        );
      }
    }

    function onScroll() {
      const id = addonId + getIdForState(history.state);
      const scrollY =
        ref === 'window' ? window.scrollY : ref.current!.scrollTop;
      const scrollX =
        ref === 'window' ? window.scrollX : ref.current!.scrollLeft;
      scrollPositions[id] = [scrollX, scrollY];
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = undefined;
      }
    }

    restoreScroll();

    const eventOpts = { passive: true } as EventListenerOptions;
    eventTarget.addEventListener('scroll', onScroll, eventOpts);
    window.addEventListener('popstate', restoreScroll);

    return () => {
      eventTarget.removeEventListener('scroll', onScroll, eventOpts);
      window.removeEventListener('popstate', restoreScroll);
      if (unsubscribe) unsubscribe();
    };
  }, [ref]);
}
