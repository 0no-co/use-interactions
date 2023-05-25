import { contains } from './element';

export interface RestoreSelection {
  element: HTMLElement;
  restore(): void;
}

const hasSelection = (node: HTMLElement): node is HTMLInputElement =>
  typeof (node as HTMLInputElement).selectionStart === 'number' &&
  typeof (node as HTMLInputElement).selectionEnd === 'number';

/** Snapshots the current focus or selection target, optinally using a ref if it's passed. */
export const snapshotSelection = (
  node?: HTMLElement | null
): RestoreSelection | null => {
  const target = document.activeElement as HTMLElement | null;
  const element = node && target && node !== target ? node : target;
  if (!element || !target) {
    return null;
  } else if (hasSelection(element)) {
    const { selectionStart, selectionEnd, selectionDirection } = element;
    return {
      element,
      restore() {
        element.focus();
        element.setSelectionRange(
          selectionStart,
          selectionEnd,
          selectionDirection || undefined
        );
      },
    };
  }

  let range: Range | undefined;

  const selection = window.getSelection();
  if (selection && selection.rangeCount) {
    const _range = selection.getRangeAt(0);
    if (_range.startContainer && contains(target, _range.startContainer)) {
      range = _range;
    }
  }

  return {
    element,
    restore() {
      element.focus();
      const selection = window.getSelection();
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },
  };
};

/** Restores a given snapshot of a selection, falling back to a simple focus. */
export const restoreSelection = (selection: RestoreSelection | null) => {
  if (selection && selection.element.parentNode) {
    selection.restore();
  }
};
