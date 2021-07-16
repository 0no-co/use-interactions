const excludeSelector = ':not([tabindex^="-"]):not([aria-modal]):not([role="dialog"])';

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

/** Returns a given tab index for an element, defaulting to zero. */
const getTabIndex = (node: Element): number => {
  const index = parseInt(node.getAttribute('tabindex')!, 10);
  return (
    index === index &&
    (node as HTMLElement).contentEditable !== 'true' &&
    index
  ) || 0;
};

/** Generic sorting function for tupel containing elements with indices and tab indices. */
const sortByTabindex = <T extends HTMLElement>(a: [number, number, T], b: [number, number, T]) => {
  return a[1] === a[1]
    ? a[0] - b[0]
    : a[1] - a[1];
};

/** Returns whether an element is visible in the context of focusability. */
const isVisible = (node: Element): boolean => !!(
  (node as HTMLElement).offsetWidth &&
  (node as HTMLElement).offsetHeight &&
  node.getClientRects().length &&
  getComputedStyle(node).visibility !== 'hidden'
);

/** Returns whether this node may contain focusable elements. */
export const hasFocusTargets = (node: Element): boolean =>
  !node.matches(excludeSelector) && isVisible(node) && !!node.querySelector(focusableSelectors);

/** Returns a sorted list of focus targets inside the given element. */
export const getFocusTargets = (node: Element): HTMLElement[] => {
  const elements = node.querySelectorAll(focusableSelectors);
  const targets: HTMLElement[] = [];
  const tabIndexTargets: [index: number, tabIndex: number, element: HTMLElement][] = [];
  for (let i = 0, l = elements.length; i < l; i++) {
    const element = elements[i] as HTMLElement;
    if (isVisible(element)) {
      const tabIndex = getTabIndex(element);
      if (tabIndex === 0) {
        targets.push(element);
      } else if (tabIndex > 0) {
        tabIndexTargets.push([i, tabIndex, element]);
      }
    }
  }

  return tabIndexTargets.length
    ? targets.concat(tabIndexTargets.sort(sortByTabindex).map(x => x[2]))
    : targets;
};

/** Returns the first focus target that should be focused automatically. */
export const getFirstFocusTargets = (node: HTMLElement): HTMLElement | null => {
  const targets = getFocusTargets(node);
  return targets.find(x => x.matches('[autofocus]')) || targets[0] || null;
};

/** Returns the next (optionally in reverse) focus target given a target node. */
export const getNextFocusTarget = (node: HTMLElement, reverse?: boolean) => {
  let current: Element | null = node;
  while (current) {
    let next: Element | null = current;
    while (next = reverse ? next.previousElementSibling : next.nextElementSibling) {
      if (hasFocusTargets(next)) {
        const targets = getFocusTargets(next);
        if (targets.length)
          return targets[reverse ? targets.length - 1 : 0];
      }
    }

    current = current.parentElement;
  }

  return null;
};
