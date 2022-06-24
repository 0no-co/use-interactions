import { contains } from './element';
import { focus } from './focus';

const clickableSelectors = [
  '[contenteditable]',
  'input:not([type="hidden"]):not([disabled])',
  'button:not([disabled])',
  'select:not([disabled])',
  'a[href]',
].join(',');

export const click = (node: Element) => {
  const activeElement = document.activeElement;
  if (!activeElement || contains(node, activeElement)) {
    let target: Element | null = node;

    if (node.tagName === 'LABEL') {
      const forId = node.getAttribute('for');
      target = forId ? document.getElementById(forId) : null;
    }

    if (!target || !node.matches(clickableSelectors)) {
      target = node.querySelector(clickableSelectors);
    }

    if (target) (target as HTMLElement).click();
    focus(activeElement);
  }
};
