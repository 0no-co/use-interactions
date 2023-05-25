import { getTabIndex, isVisible } from './element';

const excludeSelector =
  ':not([tabindex^="-"]):not([aria-modal]):not([role="dialog"])';

const focusableSelectors = [
  'input:not([type="hidden"]):not([disabled])' + excludeSelector,
  'select:not([disabled])' + excludeSelector,
  'textarea:not([disabled])' + excludeSelector,
  'button:not([disabled])' + excludeSelector,
  'iframe' + excludeSelector,
  'a[href]' + excludeSelector,
  'audio[controls]' + excludeSelector,
  'video[controls]' + excludeSelector,
  '[contenteditable]' + excludeSelector,
  '[tabindex]' + excludeSelector,
].join(',');

/** Generic sorting function for tupel containing elements with indices and tab indices. */
const sortByTabindex = (a: HTMLElement, b: HTMLElement) => {
  const tabIndexA = getTabIndex(a) || 1 << 29;
  const tabIndexB = getTabIndex(b) || 1 << 29;
  return tabIndexA - tabIndexB;
};

/** Returns whether this node is focusable. */
export const isFocusTarget = (node: Element): boolean =>
  !!node.matches(focusableSelectors) && isVisible(node);

/** Returns whether this node may contain focusable elements. */
export const hasFocusTargets = (node: Element): boolean =>
  isVisible(node) &&
  !node.matches(excludeSelector) &&
  !!node.querySelector(focusableSelectors);

/** Returns a sorted list of focus targets inside the given element. */
export const getFocusTargets = (node: Element): HTMLElement[] =>
  ([...node.querySelectorAll(focusableSelectors)] as HTMLElement[])
    .filter(isVisible)
    .sort(sortByTabindex);

/** Returns the first focus target that should be focused automatically. */
export const getFirstFocusTarget = (node: HTMLElement): HTMLElement | null =>
  getFocusTargets(node)[0] || null;

/** Returns the first focus target that should be focused automatically in a modal/dialog. */
export const getAutofocusTarget = (node: HTMLElement): HTMLElement => {
  const elements = node.querySelectorAll(focusableSelectors);
  for (let i = 0, l = elements.length; i < l; i++) {
    const element = elements[i] as HTMLElement;
    if (isVisible(element) && element.matches('[autofocus]')) return element;
  }

  node.setAttribute('tabindex', '-1');
  return node;
};

/** Returns the next (optionally in reverse) focus target given a target node. */
export const getNextFocusTarget = (
  node: HTMLElement,
  reverse?: boolean
): HTMLElement | null => {
  let current: Element | null = node;
  while (current) {
    let next: Element | null = current;
    while (
      (next = reverse ? next.previousElementSibling : next.nextElementSibling)
    ) {
      if (isVisible(next) && !!next.matches(focusableSelectors)) {
        return next as HTMLElement;
      } else if (hasFocusTargets(next)) {
        const targets = getFocusTargets(next);
        if (targets.length) return targets[reverse ? targets.length - 1 : 0];
      }
    }

    current = current.parentElement;
  }

  return null;
};

/** Focuses the given node or blurs if null is passed. */
export const focus = (node: Element | null) => {
  if (node) {
    (node as HTMLElement).focus();
  } else if (document.activeElement) {
    (document.activeElement as HTMLElement).blur();
  }
};
