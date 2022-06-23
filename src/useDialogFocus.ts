import { snapshotSelection, restoreSelection } from './utils/selection';
import {
  getFirstFocusTarget,
  getFocusTargets,
  getNextFocusTarget,
} from './utils/focus';
import { useLayoutEffect } from './utils/react';
import { contains, focus, isInputElement } from './utils/element';
import { makePriorityHook } from './usePriority';
import { Ref } from './types';

const usePriority = makePriorityHook();

export interface DialogFocusOptions {
  disabled?: boolean;
  ownerRef?: Ref<HTMLElement>;
}

export function useDialogFocus<T extends HTMLElement>(
  ref: Ref<T>,
  options?: DialogFocusOptions
) {
  const ownerRef = options && options.ownerRef;
  const disabled = !!(options && options.disabled);
  const hasPriority = usePriority(ref, disabled);

  useLayoutEffect(() => {
    const { current: element } = ref;
    if (!element || disabled) return;

    let selection = snapshotSelection(ownerRef && ownerRef.current);
    let willReceiveFocus = false;
    let focusMovesForward = true;

    function onClick(event: MouseEvent) {
      if (!element || event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (target && getFocusTargets(element).indexOf(target) > -1) {
        selection = null;
        willReceiveFocus = true;
      }
    }

    function onFocus(event: FocusEvent) {
      if (!element || event.defaultPrevented) return;

      const active = document.activeElement as HTMLElement;
      const owner =
        (ownerRef && ownerRef.current) || (selection && selection.element);

      if (
        willReceiveFocus ||
        (hasPriority && owner && contains(event.target, owner))
      ) {
        if (!contains(ref.current, active))
          selection = snapshotSelection(owner);
        willReceiveFocus = false;
        return;
      }

      // Check whether focus is about to move into the container and prevent it
      if (contains(ref.current, event.target)) {
        event.preventDefault();
        // Get the next focus target of the container
        const focusTarget = getNextFocusTarget(element, !focusMovesForward);
        focusMovesForward = true;
        focus(focusTarget);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (!element || event.defaultPrevented || event.isComposing) return;

      // Mark whether focus is moving forward for the `onFocus` handler
      if (event.code === 'Tab') {
        focusMovesForward = !event.shiftKey;
      } else if (!hasPriority) {
        return;
      }

      const active = document.activeElement as HTMLElement;
      const owner =
        (ownerRef && ownerRef.current) || (selection && selection.element);
      const focusTargets = getFocusTargets(element);

      if (
        !focusTargets.length ||
        (!contains(owner, active) && !contains(ref.current, active))
      ) {
        // Do nothing if no targets are available or the listbox or owner don't have focus
        return;
      } else if (event.code === 'Tab') {
        // Skip over the listbox via the parent if we press tab
        event.preventDefault();
        const currentTarget = contains(owner, active) ? owner! : element;
        const newTarget = getNextFocusTarget(currentTarget, event.shiftKey);
        if (newTarget) focus(newTarget);
      } else if (
        (!isInputElement(active) && event.code === 'ArrowRight') ||
        event.code === 'ArrowDown'
      ) {
        // Implement forward movement in focus targets
        event.preventDefault();
        const focusIndex = focusTargets.indexOf(active);
        const nextIndex =
          focusIndex < focusTargets.length - 1 ? focusIndex + 1 : 0;
        willReceiveFocus = true;
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
        willReceiveFocus = true;
        focusTargets[nextIndex].focus();
      } else if (event.code === 'Home') {
        // Implement Home => first item
        event.preventDefault();
        willReceiveFocus = true;
        focusTargets[0].focus();
      } else if (event.code === 'End') {
        // Implement End => last item
        event.preventDefault();
        willReceiveFocus = true;
        focusTargets[focusTargets.length - 1].focus();
      } else if (
        owner &&
        !contains(ref.current, owner) &&
        event.code === 'Escape'
      ) {
        // Restore selection if escape is pressed
        event.preventDefault();
        willReceiveFocus = false;
        restoreSelection(selection);
      } else if (
        owner &&
        isInputElement(owner) &&
        !contains(ref.current, owner) &&
        contains(owner, active) &&
        event.code === 'Enter'
      ) {
        // Move focus to first target when Enter is pressed
        const newTarget = getFirstFocusTarget(element);
        if (newTarget) {
          willReceiveFocus = true;
          newTarget.focus();
        }
      } else if (
        owner &&
        isInputElement(owner) &&
        !contains(owner, active) &&
        /^(?:Key|Digit)/.test(event.code)
      ) {
        // Restore selection if a key is pressed on input
        event.preventDefault();
        willReceiveFocus = false;
        restoreSelection(selection);
      }
    }

    element.addEventListener('mousedown', onClick, true);
    document.body.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKey);

    return () => {
      element.removeEventListener('mousedown', onClick);
      document.body.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref.current, disabled, hasPriority]);
}
