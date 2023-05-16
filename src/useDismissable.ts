import { useRef } from 'react';
import { useLayoutEffect } from './utils/react';
import { contains } from './utils/element';
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

    let willLoseFocus = false;

    function onFocusOut(event: FocusEvent) {
      const { target, relatedTarget } = event;
      if (
        !event.defaultPrevented &&
        (relatedTarget || willLoseFocus) &&
        contains(element, target) &&
        !contains(element, relatedTarget)
      ) {
        willLoseFocus = false;
        onDismissRef.current(event);
      }
    }

    function onFocusIn(event: FocusEvent) {
      const { target } = event;
      if (!event.defaultPrevented && !contains(element, target)) {
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

    if (focusLoss) {
      document.body.addEventListener('focusout', onFocusOut, true);
      document.body.addEventListener('focusin', onFocusIn, true);
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('touchstart', onClick, true);
    document.addEventListener('keydown', onKey, true);

    return () => {
      if (focusLoss) {
        document.body.removeEventListener('focusout', onFocusOut, true);
        document.body.removeEventListener('focusin', onFocusIn, true);
      }

      document.removeEventListener('click', onClick, true);
      document.removeEventListener('touchstart', onClick, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [ref.current, hasPriority, disabled, focusLoss]);
}
