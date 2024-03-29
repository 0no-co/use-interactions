const resizeOptions: ResizeObserverOptions = { box: 'border-box' };
const mutationObservers: Map<HTMLElement, MutationObserver> = new Map();
const resizeListeners: Map<HTMLElement, Array<() => void>> = new Map();

const resizeObserver =
  typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(entries => {
        const parents = new Set<Element>();
        for (let i = 0; i < entries.length; i++) {
          const parent = entries[i].target.parentElement;
          if (parent && !parents.has(parent)) {
            parents.add(parent);
            const listeners = resizeListeners.get(parent) || [];
            for (let i = 0; i < listeners.length; i++) listeners[i]();
          }
        }
      })
    : undefined;

export function observeScrollArea(
  element: HTMLElement,
  onAreaChange: (width: number, height: number) => void
): () => void {
  const listeners = resizeListeners.get(element) || [];
  const isFirstListener = !listeners.length;
  resizeListeners.set(element, listeners);

  let previousScrollHeight: null | number = null;
  let hasUnmounted = false;
  const onResize = () => {
    const scrollHeight = element.scrollHeight || 0;
    if (!hasUnmounted && scrollHeight !== previousScrollHeight) {
      onAreaChange(element.scrollWidth, element.scrollHeight);
      previousScrollHeight = scrollHeight;
    }
  };

  listeners.push(onResize);

  if (isFirstListener) {
    const mutationObserver = new MutationObserver(entries => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        for (let j = 0; j < entry.addedNodes.length; j++) {
          const node = entry.addedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            resizeObserver!.observe(node as Element, resizeOptions);
          }
        }

        for (let j = 0; j < entry.removedNodes.length; j++) {
          const node = entry.removedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            resizeObserver!.unobserve(node as Element);
          }
        }
      }
    });

    requestAnimationFrame(() => {
      const childNodes = element.childNodes;
      for (let i = 0; i < childNodes.length; i++)
        if (childNodes[i].nodeType === Node.ELEMENT_NODE)
          resizeObserver!.observe(childNodes[i] as Element, resizeOptions);
      mutationObserver.observe(element, { childList: true });
    });

    mutationObservers.set(element, mutationObserver);
  }

  return () => {
    const listeners = resizeListeners.get(element) || [];
    listeners.splice(listeners.indexOf(onResize), 1);
    hasUnmounted = true;

    if (!listeners.length) {
      const mutationObserver = mutationObservers.get(element);
      if (mutationObserver) mutationObserver.disconnect();

      const childNodes = element.childNodes;
      for (let i = 0; i < childNodes.length; i++)
        if (childNodes[i].nodeType === Node.ELEMENT_NODE)
          resizeObserver!.unobserve(childNodes[i] as Element);

      resizeListeners.delete(element);
      mutationObservers.delete(element);
    }
  };
}
