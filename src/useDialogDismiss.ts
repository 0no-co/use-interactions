import { useLayoutEffect } from './utils/react';
import { contains } from './utils/element';
import { makePriorityHook } from './usePriority';
import { Ref } from './types';

const usePriority = makePriorityHook();

export function useDialogDismiss<T extends HTMLElement>(
  ref: Ref<T>,
  onDismiss: () => void
) {
  const hasPriority = usePriority(ref);

  useLayoutEffect(() => {
    if (!ref.current || !hasPriority) return;

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

      event.preventDefault();
      onDismiss();
    }

    if (hasPriority) {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('touchstart', onClick);
    }

    document.addEventListener('keydown', onKey);

    return () => {
      if (hasPriority) {
        document.removeEventListener('mousedown', onClick);
        document.removeEventListener('touchstart', onClick);
      }

      document.removeEventListener('keydown', onKey);
    };
  }, [ref, hasPriority, onDismiss]);
}
