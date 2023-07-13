import type { CSSProperties } from 'react';

export interface Ref<T extends HTMLElement | SVGElement> {
  readonly current: T | null;
}

export interface Style extends CSSProperties {}
