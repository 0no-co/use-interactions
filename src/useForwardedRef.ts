import { useRef, ForwardedRef } from 'react';
import { Ref } from './types';

type RefWithState<T extends HTMLElement> = Ref<T> & {
  _forwarded?: ForwardedRef<T>;
  _current?: T | null;
};

export function useForwardedRef<T extends HTMLElement>(
  forwarded: ForwardedRef<T>
): Ref<T> {
  const ref = useRef<RefWithState<T> | null>(null);
  if (!ref.current || ref.current._forwarded !== forwarded) {
    ref.current = Object.defineProperty({ _forwarded: forwarded }, 'current', {
      enumerable: true,
      configurable: true,
      get() {
        return this._current || null;
      },
      set(value: T | null) {
        this._current = value;
        if (typeof this._forwarded === 'function') {
          this._forwarded(value);
        } else if (forwarded) {
          this._forwarded.current = value;
        }
      },
    }) as RefWithState<T>;
  }
  return ref.current;
}
