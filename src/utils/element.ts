/** Returns a given tab index for an element, defaulting to zero. */
export const getTabIndex = (node: Element): number => {
  const index = parseInt(node.getAttribute('tabindex')!, 10);
  return (
    (index === index && !(node as HTMLElement).isContentEditable && index) || 0
  );
};

/** Returns whether an element is visible in the context of focusability. */
export const isVisible = (node: Element): boolean =>
  !!(
    (node.tagName !== 'INPUT' ||
      (node as HTMLInputElement).type !== 'hidden') &&
    node.getClientRects().length &&
    getComputedStyle(node).visibility !== 'hidden'
  );

/** Returns whether an element accepts text input. */
export const isInputElement = (node: Element): boolean =>
  !!(
    node.tagName === 'INPUT' ||
    node.tagName === 'TEXTAREA' ||
    (node as HTMLElement).isContentEditable
  );

export const contains = (
  owner: Element | EventTarget | null,
  node: Element | EventTarget | null
) =>
  !!(
    node &&
    owner &&
    (owner === node || (owner as Element).contains(node as Element))
  );

export const focus = (element: Element | null) => {
  if (element) {
    (element as HTMLElement).focus();
  } else if (document.activeElement) {
    (document.activeElement as HTMLElement).blur();
  }
};
