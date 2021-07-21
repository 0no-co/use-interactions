import { useLayoutEffect } from './utils/react';
import { observeScrollHeight } from './utils/observeScrollHeight';
import { Ref } from './types';

const getIdForState = (() => {
  const defaultState = {};
  const stateToId = new WeakMap<{}, string>();

  let uniqueID = 1;

  return (state?: {} | null): string => {
    if (!state) state = defaultState;
    let id = stateToId.get(state);
    if (!id) stateToId.set(state, (id = (uniqueID++).toString(36)));
    return `${id}${document.location}`;
  };
})();

const scrollPositions: Record<string, number> = {};

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
      const id = `${addonId}${getIdForState(
        event ? event.state : history.state
      )}:${window.location}`;
      const scrollHeight =
        ref === 'window'
          ? document.body.scrollHeight
          : ref.current!.scrollHeight;
      const scrollY = scrollPositions[id];
      if (!scrollY) {
        // noop
      } else if (scrollHeight >= scrollY) {
        scrollTarget.scrollTo(0, scrollY);
      } else {
        if (unsubscribe) unsubscribe();
        unsubscribe = observeScrollHeight(
          ref === 'window' ? document.body : ref.current!,
          (scrollHeight: number) => {
            // the scroll position shouldn't have changed by more than half the screen height
            const hasMoved =
              Math.abs(scrollY - scrollPositions[id]) > window.innerHeight / 2;
            // then we restore the position as it's now possible
            if (!hasMoved && scrollHeight >= scrollY)
              scrollTarget.scrollTo(0, scrollY);
            if (unsubscribe) unsubscribe();
          }
        );
      }
    }

    function onScroll() {
      const id = `${addonId}${getIdForState(history.state)}:${window.location}`;
      const scrollY =
        ref === 'window' ? window.scrollY : ref.current!.scrollTop;
      scrollPositions[id] = scrollY || 0;
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
