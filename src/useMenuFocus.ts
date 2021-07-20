import {
  RestoreSelection,
  snapshotSelection,
  restoreSelection,
} from './utils/selection';
import { getFirstFocusTarget, getFocusTargets } from './utils/focus';
import { useLayoutEffect } from './utils/react';
import { contains, isInputElement } from './utils/element';
import { Ref } from './types';

export interface MenuFocusOptions {
  disabled?: boolean;
  ownerRef?: Ref<HTMLElement>;
}

export function useMenuFocus<T extends HTMLElement>(
  ref: Ref<T>,
  options?: MenuFocusOptions
) {
  const ownerRef = options && options.ownerRef;
  const disabled = !!(options && options.disabled);

  useLayoutEffect(() => {
    if (!ref.current || disabled) return;

    let selection: RestoreSelection | null = null;

    function onFocus(event: FocusEvent) {
      if (!ref.current || event.defaultPrevented) return;

      const owner =
        (ownerRef && ownerRef.current) || (selection && selection.element);
      const { relatedTarget, target } = event;
      if (relatedTarget === owner) {
        // When owner is explicitly passed we can make a snapshot early
        selection = snapshotSelection(owner);
      } else if (
        contains(ref.current, target) &&
        !contains(ref.current, relatedTarget) &&
        (!ownerRef || contains(relatedTarget, ownerRef.current))
      ) {
        // Check whether focus is about to move into the container and snapshot last focus
        selection = snapshotSelection(owner);
      } else if (
        contains(ref.current, relatedTarget) &&
        !contains(ref.current, target)
      ) {
        // Reset focus if it's lost and has left the menu
        selection = null;
      }
    }

    function onKey(event: KeyboardEvent) {
      if (!ref.current || event.defaultPrevented || event.isComposing) return;

      const owner =
        (ownerRef && ownerRef.current) || (selection && selection.element);
      const active = document.activeElement as HTMLElement;
      const focusTargets = getFocusTargets(ref.current);
      if (
        !focusTargets.length ||
        (!contains(ref.current, active) && !contains(owner, active))
      ) {
        // Do nothing if container doesn't contain focus or not targets are available
        return;
      }

      if (
        (!isInputElement(active) && event.code === 'ArrowRight') ||
        event.code === 'ArrowDown'
      ) {
        // Implement forward movement in focus targets
        event.preventDefault();
        const focusIndex = focusTargets.indexOf(active);
        const nextIndex =
          focusIndex < focusTargets.length - 1 ? focusIndex + 1 : 0;
        focusTargets[nextIndex].focus();
      } else if (
        (!isInputElement(active) && event.code === 'ArrowLeft') ||
        event.code === 'ArrowUp'
      ) {
        // Implement backward movement in focus targets
        event.preventDefault();
        const focusIndex = focusTargets.indexOf(active);
        const nextIndex =
          focusIndex > 0 ? focusIndex - 1 : focusTargets.length - 1;
        focusTargets[nextIndex].focus();
      } else if (event.code === 'Home') {
        // Implement Home => first item
        event.preventDefault();
        focusTargets[0].focus();
      } else if (event.code === 'End') {
        // Implement End => last item
        event.preventDefault();
        focusTargets[focusTargets.length - 1].focus();
      } else if (
        owner &&
        isInputElement(owner) &&
        contains(owner, active) &&
        event.code === 'Enter'
      ) {
        // Move focus to first target when enter is pressed
        event.preventDefault();
        const newTarget = getFirstFocusTarget(ref.current);
        if (newTarget) newTarget.focus();
      } else if (
        owner &&
        !contains(ref.current, owner) &&
        !contains(owner, active) &&
        event.code === 'Escape'
      ) {
        // Restore selection if escape is pressed
        event.preventDefault();
        restoreSelection(selection);
      } else if (
        owner &&
        isInputElement(owner) &&
        !contains(owner, active) &&
        /^(?:Key|Digit)/.test(event.code)
      ) {
        // Restore selection if a key is pressed on input
        restoreSelection(selection);
      }
    }

    document.body.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, disabled]);
}
