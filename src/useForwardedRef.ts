import { useRef, ForwardedRef } from 'react';
import { Ref } from './types';

type RefWithState<T extends HTMLElement> = Ref<T> & {
  _forwarded?: ForwardedRef<T>;
  _current?: T | null;
};

export function useForwardedRef<T extends HTMLElement>(
  forwarded: ForwardedRef<T>
): Ref<T> {
  const ref: RefWithState<T> = useRef<T>(null);
  if (ref._forwarded !== forwarded) {
    ref._forwarded = forwarded;
    Object.defineProperty(ref, 'current', {
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
    });
  }

  return ref;
}
