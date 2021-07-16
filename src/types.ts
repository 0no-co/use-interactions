export interface Ref<T extends HTMLElement> {
  readonly current: T | null;
}
