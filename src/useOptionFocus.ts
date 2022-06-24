import { isFocusTarget } from './utils/focus';
import { useLayoutEffect } from './utils/react';
import { click } from './utils/click';
import { contains, isInputElement } from './utils/element';
import { makePriorityHook } from './usePriority';
import { Ref } from './types';

const usePriority = makePriorityHook();

export interface OptionFocusOptions {
  disabled?: boolean;
}

export function useOptionFocus<T extends HTMLElement>(
  ref: Ref<T>,
  options?: OptionFocusOptions
) {
  const disabled = !!(options && options.disabled);
  const hasPriority = usePriority(ref, disabled);

  useLayoutEffect(() => {
    const { current: element } = ref;
    // NOTE: This behaviour isn't necessary for input elements
    if (!element || disabled || isInputElement(element)) return;

    function onKey(event: KeyboardEvent) {
      if (!element || event.defaultPrevented || event.isComposing) return;

      const active = document.activeElement as HTMLElement;
      if (!isFocusTarget(element) || !contains(active, element)) {
        // Do nothing if the current item is not a target or not focused
        return;
      } else if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        click(element);
      }
    }

    element.addEventListener('keydown', onKey);
    return () => {
      element.removeEventListener('keydown', onKey);
    };
  }, [ref.current, disabled, hasPriority]);
}
