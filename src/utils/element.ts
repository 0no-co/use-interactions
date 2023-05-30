import { inputSelectors } from './focus';

const excludeSelector =
  ':not([tabindex^="-"]):not([aria-modal]):not([role="dialog"])';

/** Returns a given tab index for an element, defaulting to zero. */
export const getTabIndex = (node: HTMLElement): number =>
  (!node.isContentEditable && node.tabIndex) || 0;

/** Returns whether an element is visible in the context of focusability. */
export const isVisible = (node: Element): node is HTMLElement =>
  node.matches(excludeSelector) && node.getClientRects().length > 0;

/** Returns whether an element accepts text input. */
export const isInputElement = (node: Element | null): boolean =>
  !!node && node.matches(inputSelectors);

export const contains = (
  owner: Element | EventTarget | null,
  node: Element | EventTarget | null
): owner is HTMLElement =>
  !!(
    node &&
    owner &&
    (owner === node || (owner as Element).contains(node as Element))
  );

/** Returns the root element of the input element */
export const getRoot = (node: Element): HTMLElement =>
  (node.getRootNode() || document.body) as HTMLElement;
