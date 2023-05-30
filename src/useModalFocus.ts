import {
  RestoreSelection,
  snapshotSelection,
  restoreSelection,
} from './utils/selection';

import { getActive, getAutofocusTarget, getFocusTargets } from './utils/focus';
import { useLayoutEffect } from './utils/react';
import { contains, getRoot } from './utils/element';
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
    const { current: element } = ref;
    if (!element || disabled) return;

    const root = getRoot(element);
    const active = getActive();
    let selection: RestoreSelection | null = null;
    if (!active || !contains(element, active)) {
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
        const target = getFocusTargets(element)[0];
        if (target) target.focus();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      const { current: element } = ref;
      if (!hasPriority.current || !element || event.defaultPrevented) return;

      if (event.code === 'Tab') {
        const activeElement = getActive()!;
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

    root.addEventListener('focusout', onBlur);
    root.addEventListener('keydown', onKeyDown);

    return () => {
      root.removeEventListener('focusout', onBlur);
      root.removeEventListener('keydown', onKeyDown);
      restoreSelection(selection);
    };
  }, [ref.current, hasPriority, disabled]);
}
