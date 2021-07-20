import { contains } from './element';

interface RestoreInputSelection {
  element: HTMLInputElement;
  method: 'setSelectionRange';
  arguments: [number, number, 'forward' | 'backward' | 'none' | undefined];
}

interface RestoreActiveNode {
  element: HTMLElement;
  method: 'focus';
}

interface RestoreSelectionRange {
  element: HTMLElement;
  method: 'range';
  range: Range;
}

export type RestoreSelection =
  | RestoreInputSelection
  | RestoreActiveNode
  | RestoreSelectionRange;

const hasSelection = (node: HTMLElement): node is HTMLInputElement =>
  (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') &&
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
    return {
      element,
      method: 'setSelectionRange',
      arguments: [
        element.selectionStart!,
        element.selectionEnd!,
        element.selectionDirection || undefined,
      ],
    };
  }

  const selection = window.getSelection && window.getSelection();
  if (selection && selection.rangeCount) {
    const range = selection.getRangeAt(0);
    if (contains(target, range.startContainer)) {
      return { element, method: 'range', range };
    }
  }

  return { element, method: 'focus' };
};

/** Restores a given snapshot of a selection, falling back to a simple focus. */
export const restoreSelection = (restore: RestoreSelection | null) => {
  if (!restore || !restore.element.parentNode) {
    return;
  } else if (restore.method === 'setSelectionRange') {
    restore.element.focus();
    restore.element.setSelectionRange(...restore.arguments);
  } else if (restore.method === 'range') {
    const selection = window.getSelection()!;
    restore.element.focus();
    selection.removeAllRanges();
    selection.addRange(restore.range);
  } else {
    restore.element.focus();
  }
};
