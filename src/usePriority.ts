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
  ): boolean {
    const isDisabled = !!disabled;
    const [hasPriority, setHasPriority] = useState(() => {
      if (!ref.current) return false;
      const tempStack = priorityStack.concat(ref.current).sort(sortByHierarchy);
      return tempStack[0] === ref.current;
    });

    useLayoutEffect(() => {
      if (!ref.current || isDisabled) return;

      const { current } = ref;

      function onChange() {
        setHasPriority(() => priorityStack[0] === ref.current);
      }

      priorityStack.push(current);
      priorityStack.sort(sortByHierarchy);
      listeners.add(onChange);
      listeners.forEach(fn => fn());

      return () => {
        const index = priorityStack.indexOf(current);
        priorityStack.splice(index, 1);
        listeners.delete(onChange);
        listeners.forEach(fn => fn());
      };
    }, [ref.current!, isDisabled]);

    return hasPriority;
  };
};
