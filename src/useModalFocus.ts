import {
  RestoreSelection,
  snapshotSelection,
  restoreSelection,
} from './utils/selection';

import {
  getAutofocusTarget,
  getFirstFocusTarget,
  getFocusTargets,
} from './utils/focus';

import { useLayoutEffect } from './utils/react';
import { contains } from './utils/element';
import { makePriorityHook } from './usePriority';
import { Ref } from './types';

const usePriority = makePriorityHook();

export interface ModalFocusOptions {
  disabled?: boolean;
}

export function useModalFocus<T extends HTMLElement>(
  ref: Ref<T>,
  options?: ModalFocusOptions
) {
  const disabled = !!(options && options.disabled);
  const hasPriority = usePriority(ref, disabled);

  useLayoutEffect(() => {
    if (!ref.current || !hasPriority || disabled) return;

    let selection: RestoreSelection | null = null;
    if (
      !document.activeElement ||
      !ref.current.contains(document.activeElement)
    ) {
      const newTarget = getAutofocusTarget(ref.current);
      selection = snapshotSelection(ref.current);
      newTarget.focus();
    }

    function onBlur(event: FocusEvent) {
      const parent = ref.current;
      if (!parent || event.defaultPrevented) return;

      if (
        contains(parent, event.target) &&
        !contains(parent, event.relatedTarget)
      ) {
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
      restoreSelection(selection);
      document.body.removeEventListener('focusout', onBlur);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref.current!, hasPriority, disabled]);
}
