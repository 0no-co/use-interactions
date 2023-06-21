import { useRef } from 'react';
import { useLayoutEffect } from './utils/react';
import { contains, getRoot } from './utils/element';
import { makePriorityHook } from './usePriority';
import { Ref } from './types';

const usePriority = makePriorityHook();

export interface DismissableOptions {
  focusLoss?: boolean;
  disabled?: boolean;
}

export function useDismissable<T extends HTMLElement>(
  ref: Ref<T>,
  onDismiss: (event: Event) => void,
  options?: DismissableOptions
) {
  const focusLoss = !!(options && options.focusLoss);
  const disabled = !!(options && options.disabled);
  const hasPriority = usePriority(ref, disabled);
  const onDismissRef = useRef(onDismiss);

  useLayoutEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useLayoutEffect(() => {
    const { current: element } = ref;
    if (!element || disabled) return;

    const root = getRoot(element);
    let willLoseFocus = false;

    function onFocusOut(event: FocusEvent) {
      const { target, relatedTarget } = event;
      if (
        !event.defaultPrevented &&
        willLoseFocus &&
        contains(element, target) &&
        !contains(element, relatedTarget)
      ) {
        willLoseFocus = false;
        onDismissRef.current(event);
      }
    }

    function onFocusIn(event: FocusEvent) {
      const { target } = event;
      if (
        !event.defaultPrevented &&
        willLoseFocus &&
        !contains(element, target)
      ) {
        willLoseFocus = false;
        onDismissRef.current(event);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.isComposing) {
        return;
      }

      if (event.code === 'Escape' && hasPriority.current) {
        // The current dialog can be dismissed by pressing escape if it either has focus
        // or it has priority
        event.preventDefault();
        onDismissRef.current(event);
      } else if (event.code === 'Tab') {
        willLoseFocus = true;
      }
    }

    function onClick(event: MouseEvent | TouchEvent) {
      const { target } = event;
      if (event.defaultPrevented) {
        return;
      } else if (contains(element, target)) {
        willLoseFocus = false;
        return;
      } else if (hasPriority.current) {
        // The current dialog can be dismissed by pressing outside of it if it either has
        // focus or it has priority
        event.preventDefault();
        onDismissRef.current(event);
      }
    }

    const opts = { capture: true } as any;
    const touchOpts = { capture: true, passive: false } as any;

    if (focusLoss) {
      root.addEventListener('focusout', onFocusOut, opts);
      root.addEventListener('focusin', onFocusIn, opts);
    }

    root.addEventListener('click', onClick, opts);
    root.addEventListener('touchstart', onClick, touchOpts);
    root.addEventListener('keydown', onKey, opts);

    return () => {
      if (focusLoss) {
        root.removeEventListener('focusout', onFocusOut, opts);
        root.removeEventListener('focusin', onFocusIn, opts);
      }

      root.removeEventListener('click', onClick, opts);
      root.removeEventListener('touchstart', onClick, touchOpts);
      root.removeEventListener('keydown', onKey, opts);
    };
  }, [ref.current, hasPriority, disabled, focusLoss]);
}
