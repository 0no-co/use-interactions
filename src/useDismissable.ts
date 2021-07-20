import { useLayoutEffect } from './utils/react';
import { contains } from './utils/element';
import { makePriorityHook } from './usePriority';
import { Ref } from './types';

const usePriority = makePriorityHook();

export interface DismissableOptions {
  focusLoss?: boolean;
}

export function useDismissable<T extends HTMLElement>(
  ref: Ref<T>,
  onDismiss: () => void,
  options?: DismissableOptions
) {
  const focusLoss = !!(options && options.focusLoss);
  const hasPriority = usePriority(ref);

  useLayoutEffect(() => {
    if (!ref.current || !hasPriority) return;

    function onFocusOut(event: FocusEvent) {
      if (event.defaultPrevented) return;

      const { target, relatedTarget } = event;
      if (
        contains(ref.current, target) &&
        !contains(ref.current, relatedTarget)
      ) {
        onDismiss();
      }
    }

    function onKey(event: KeyboardEvent) {
      if (!event.isComposing && event.code === 'Escape') {
        // The current dialog can be dismissed by pressing escape if it either has focus
        // or it has priority
        const active = document.activeElement;
        if (hasPriority || (active && contains(ref.current, active))) {
          event.preventDefault();
          onDismiss();
        }
      }
    }

    function onClick(event: MouseEvent | TouchEvent) {
      const { target } = event;
      if (contains(ref.current, target) || event.defaultPrevented) {
        return;
      }

      // The current dialog can be dismissed by pressing outside of it if it either has
      // focus or it has priority
      const active = document.activeElement;
      if (hasPriority || (active && contains(ref.current, active))) {
        event.preventDefault();
        onDismiss();
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
  }, [ref, hasPriority, focusLoss, onDismiss]);
}
