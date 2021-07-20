import { snapshotSelection, restoreSelection } from './utils/selection';
import {
  getFirstFocusTarget,
  getFocusTargets,
  getNextFocusTarget,
} from './utils/focus';
import { useLayoutEffect } from './utils/react';
import { contains, isInputElement } from './utils/element';
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
    if (!ref.current || disabled || !hasPriority) return;

    let selection = snapshotSelection(ownerRef && ownerRef.current);
    let willReceiveFocus = false;
    let focusMovesForward = true;

    function onClick(event: MouseEvent) {
      if (!ref.current || event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      if (target && getFocusTargets(ref.current).indexOf(target) > -1) {
        selection = null;
        willReceiveFocus = true;
      }
    }

    function onFocus(event: FocusEvent) {
      if (!ref.current || event.defaultPrevented) return;

      const active = document.activeElement as HTMLElement;
      const owner =
        (ownerRef && ownerRef.current) || (selection && selection.element);

      if (willReceiveFocus || (owner && event.target === owner)) {
        if (!contains(ref.current, active))
          selection = snapshotSelection(owner);
        willReceiveFocus = false;
        return;
      }

      const { relatedTarget, target } = event;
      // Check whether focus is about to move into the container and prevent it
      if (
        contains(ref.current, target) &&
        !contains(ref.current, relatedTarget)
      ) {
        // Get the next focus target of the container
        const focusTarget = getNextFocusTarget(ref.current, !focusMovesForward);
        if (focusTarget) {
          focusMovesForward = true;
          event.preventDefault();
          focusTarget.focus();
        }
      }
    }

    function onKey(event: KeyboardEvent) {
      if (!ref.current || event.defaultPrevented || event.isComposing) return;

      // Mark whether focus is moving forward for the `onFocus` handler
      if (event.code === 'Tab') {
        focusMovesForward = !event.shiftKey;
      }

      const active = document.activeElement as HTMLElement;
      const owner =
        (ownerRef && ownerRef.current) || (selection && selection.element);
      const focusTargets = getFocusTargets(ref.current);

      if (
        !focusTargets.length ||
        (!contains(owner, active) && !contains(ref.current, active))
      ) {
        // Do nothing if no targets are available or the listbox or owner don't have focus
        return;
      } else if (event.code === 'Tab') {
        // Skip over the listbox via the parent if we press tab
        const currentTarget = contains(owner, active) ? owner! : ref.current;
        const focusTarget = getNextFocusTarget(currentTarget, event.shiftKey);
        if (focusTarget) {
          event.preventDefault();
          focusTarget.focus();
        }
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
        // Move focus to first target when enter is pressed
        event.preventDefault();
        const newTarget = getFirstFocusTarget(ref.current);
        if (newTarget) {
          willReceiveFocus = true;
          newTarget.focus();
        }
      } else if (
        owner &&
        contains(owner, active) &&
        isInputElement(owner) &&
        /^(?:Key|Digit)/.test(event.code)
      ) {
        // Restore selection if a key is pressed on input
        event.preventDefault();
        willReceiveFocus = false;
        restoreSelection(selection);
      }
    }

    ref.current.addEventListener('mousedown', onClick, true);
    document.body.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKey);

    return () => {
      ref.current!.removeEventListener('mousedown', onClick);
      document.body.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, hasPriority, disabled]);
}
