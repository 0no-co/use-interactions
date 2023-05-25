import { clickableSelectors, focus } from './focus';
import { contains } from './element';

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

    ((target || node) as HTMLElement).click();
    focus(activeElement);
  }
};
