import { useLayoutEffect } from './utils/react';
import { Ref } from './types';

const mutationObservers: Map<HTMLElement, MutationObserver> = new Map();
const resizeListeners: Map<HTMLElement, Array<() => void>> = new Map();

const resizeObserver = new ResizeObserver(entries => {
  const parents = new Set<Element>();
  for (let i = 0; i < entries.length; i++) {
    const parent = entries[i].target.parentElement;
    if (parent && !parents.has(parent)) {
      parents.add(parent);
      const listeners = resizeListeners.get(parent) || [];
      for (let i = 0; i < listeners.length; i++) listeners[i]();
    }
  }
});

function observeScrollHeight(
  element: HTMLElement,
  onScrollHeightChange: (scrollHeight: number) => void
): () => void {
  const listeners = resizeListeners.get(element) || [];
  const isFirstListener = !listeners.length;
  resizeListeners.set(element, listeners);

  let previousScrollHeight: null | number = null;
  let hasUnmounted = false;
  const onResize = () => {
    const scrollHeight = element.scrollHeight || 0;
    if (!hasUnmounted && scrollHeight !== previousScrollHeight) {
      onScrollHeightChange(element.scrollHeight);
      previousScrollHeight = scrollHeight;
    }
  };

  listeners.push(onResize);

  if (isFirstListener) {
    const mutationObserver = new MutationObserver(entries => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        for (let j = 0; j < entry.addedNodes.length; j++) {
          const node = entry.addedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            resizeObserver.observe(node as Element);
          }
        }

        for (let j = 0; j < entry.removedNodes.length; j++) {
          const node = entry.removedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            resizeObserver.unobserve(node as Element);
          }
        }
      }
    });

    const childNodes = element.childNodes;
    for (let i = 0; i < childNodes.length; i++)
      if (childNodes[i].nodeType === Node.ELEMENT_NODE)
        resizeObserver.observe(childNodes[i] as Element);

    mutationObserver.observe(element, { childList: true });
    mutationObservers.set(element, mutationObserver);
  }

  requestAnimationFrame(onResize);

  return () => {
    const listeners = resizeListeners.get(element) || [];
    listeners.splice(listeners.indexOf(onResize), 1);
    hasUnmounted = true;

    if (!listeners.length) {
      const mutationObserver = mutationObservers.get(element);
      if (mutationObserver) mutationObserver.disconnect();

      const childNodes = element.childNodes;
      for (let i = 0; i < childNodes.length; i++)
        if (childNodes[i].nodeType === Node.ELEMENT_NODE)
          resizeObserver.unobserve(childNodes[i] as Element);

      resizeListeners.delete(element);
      mutationObservers.delete(element);
    }
  };
}

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
