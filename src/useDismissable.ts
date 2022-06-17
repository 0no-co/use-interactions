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
  onDismiss: () => void,
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

    function onFocusOut(event: FocusEvent) {
      if (event.defaultPrevented) return;

      const { target, relatedTarget } = event;
      if (contains(element, target) && !contains(element, relatedTarget)) {
        onDismissRef.current();
      }
    }

    function onKey(event: KeyboardEvent) {
      if (!event.isComposing && event.code === 'Escape') {
        // The current dialog can be dismissed by pressing escape if it either has focus
        // or it has priority
        const active = document.activeElement;
        if (hasPriority || (active && contains(element, active))) {
          event.preventDefault();
          onDismissRef.current();
        }
      }
    }

    function onClick(event: MouseEvent | TouchEvent) {
      const { target } = event;
      if (contains(element, target) || event.defaultPrevented) {
        return;
      }

      // The current dialog can be dismissed by pressing outside of it if it either has
      // focus or it has priority
      const active = document.activeElement;
      if (hasPriority || (active && contains(element, active))) {
        event.preventDefault();
        onDismissRef.current();
      }
    }

    if (focusLoss) document.body.addEventListener('focusout', onFocusOut);

    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      if (focusLoss) document.body.removeEventListener('focusout', onFocusOut);

      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref.current, hasPriority, disabled, focusLoss]);
}
