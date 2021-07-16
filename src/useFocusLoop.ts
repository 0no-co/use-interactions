import { useLayoutEffect } from 'react';
import { getFirstFocusTarget, getFocusTargets } from './utils/focus';
import { contains } from './utils/element';
import { Ref } from './types';

export function useFocusLoop<T extends HTMLElement>(ref: Ref<T>) {
  useLayoutEffect(() => {
    if (!ref.current) return;

    let active = document.activeElement as HTMLElement | null;
    if (!active || !ref.current.contains(active)) {
      active = getFirstFocusTarget(ref.current);
      if (active) active.focus();
    }

    function onBlur(event: FocusEvent) {
      const parent = ref.current;
      if (!parent || event.defaultPrevented) return;

      if (contains(parent, event.target) && !contains(parent, event.relatedTarget)) {
        const target = getFirstFocusTarget(parent);
        if (target) target.focus();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const parent = ref.current;
      if (!parent || event.defaultPrevented) return;

      if (event.code === 'Tab') {
        const activeElement = document.activeElement as HTMLElement;
        const targets = getFocusTargets(parent);
        const index = targets.indexOf(activeElement);
        if (event.shiftKey && index === 0) {
          event.preventDefault();
          targets[targets.length - 1].focus();
        } else if (!event.shiftKey && index === targets.length - 1) {
          event.preventDefault();
          targets[0].focus();
        }

      }
    }

    document.body.addEventListener('focusout', onBlur);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.removeEventListener('focusout', onBlur);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref]);
}
