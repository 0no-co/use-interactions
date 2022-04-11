import type { CSSProperties } from 'react';

export interface Ref<T extends HTMLElement> {
  readonly current: T | null;
}

export interface Style extends CSSProperties {}
