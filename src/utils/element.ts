/** Returns a given tab index for an element, defaulting to zero. */
export const getTabIndex = (node: HTMLElement): number =>
  (!node.isContentEditable && node.tabIndex) || 0;

/** Returns whether an element is visible in the context of focusability. */
export const isVisible = (node: Element): boolean =>
  node.getClientRects().length > 0;

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
