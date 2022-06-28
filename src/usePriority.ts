import { useState } from 'react';
import { useLayoutEffect } from './utils/react';
import { Ref } from './types';

/** Creates a priority stack of elements so that we can determine the "deepest" one to be the active hook */
export const makePriorityHook = () => {
  const listeners: Set<Function> = new Set();
  const priorityStack: HTMLElement[] = [];

  const sortByHierarchy = (a: HTMLElement, b: HTMLElement) => {
    const x = a.compareDocumentPosition(b);
    return (
      (x & 16 /* a contains b */ && 1) ||
      (x & 8 /* b contains a */ && -1) ||
      (x & 4 /* a follows b */ && 1) ||
      (x & 2 /* b follows a */ && -1) ||
      0
    );
  };

  /** Indicates whether a given element on a stack of active priority hooks is the deepest element. */
  return function usePriority<T extends HTMLElement>(
    ref: Ref<T>,
    disabled?: boolean
  ): { current: boolean } {
    const isDisabled = !!disabled;
    const [hasPriority] = useState(() => ({
      current:
        !!ref.current &&
        priorityStack.concat(ref.current).sort(sortByHierarchy)[0] ===
          ref.current,
    }));

    useLayoutEffect(() => {
      const { current: element } = ref;
      if (!element || isDisabled) return;

      function onChange() {
        hasPriority.current = priorityStack[0] === ref.current;
      }

      priorityStack.push(element);
      priorityStack.sort(sortByHierarchy);
      listeners.add(onChange);
      listeners.forEach(fn => fn());

      return () => {
        const index = priorityStack.indexOf(element);
        priorityStack.splice(index, 1);
        listeners.delete(onChange);
        listeners.forEach(fn => fn());
      };
    }, [ref.current, hasPriority, isDisabled]);

    return hasPriority;
  };
};
