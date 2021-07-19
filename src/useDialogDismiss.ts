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
    if (!hasPriority) return;

    function onKey(event: KeyboardEvent) {
      if (
        event.isComposing ||
        event.defaultPrevented ||
        event.code !== 'Escape'
      )
        return;
      event.preventDefault();
      onDismiss();
    }

    function onClick(event: MouseEvent | TouchEvent) {
      if (
        !ref.current ||
        contains(ref.current, event.target) ||
        event.defaultPrevented
      )
        return;
      event.preventDefault();
      onDismiss();
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, hasPriority, onDismiss]);
}
