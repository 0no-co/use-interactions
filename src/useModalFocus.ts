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
    if (disabled) return;

    let selection: RestoreSelection | null = null;
    if (
      !document.activeElement ||
      !contains(ref.current, document.activeElement)
    ) {
      const newTarget = ref.current ? getAutofocusTarget(ref.current) : null;
      selection = snapshotSelection();
      if (newTarget) newTarget.focus();
    }

    function onBlur(event: FocusEvent) {
      const { current: element } = ref;
      if (!hasPriority.current || !element || event.defaultPrevented) return;

      if (
        contains(element, event.target) &&
        !contains(element, event.relatedTarget)
      ) {
        const target = getFirstFocusTarget(element);
        if (target) target.focus();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const { current: element } = ref;
      if (!hasPriority.current || !element || event.defaultPrevented) return;

      if (event.code === 'Tab') {
        const activeElement = document.activeElement as HTMLElement;
        const targets = getFocusTargets(element);
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
      restoreSelection(selection);
    };
  }, [ref, hasPriority, disabled]);
}
