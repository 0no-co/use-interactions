/** Returns a given tab index for an element, defaulting to zero. */
export const getTabIndex = (node: Element): number => {
  const index = parseInt(node.getAttribute('tabindex')!, 10);
  return (
    index === index &&
    (node as HTMLElement).contentEditable !== 'true' &&
    index
  ) || 0;
};

/** Returns whether an element is visible in the context of focusability. */
export const isVisible = (node: Element): boolean => !!(
  (node as HTMLElement).offsetWidth &&
  (node as HTMLElement).offsetHeight &&
  node.getClientRects().length &&
  getComputedStyle(node).visibility !== 'hidden'
);

export const contains = (owner: Element | null, node: Element | EventTarget | null) =>
  !!(node && owner && (owner === node || owner.contains(node as Element)));
