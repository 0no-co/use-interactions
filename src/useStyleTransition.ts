import type { Style, Ref } from './types';
import { useState, useCallback } from 'react';
import { useLayoutEffect } from './utils/react';

const animations = new WeakMap<HTMLElement, Animation>();

export interface TransitionOptions {
  style?: Style | null;
  duration?: number | string;
  easing?: string | [number, number, number, number];
}

const animate = (element: HTMLElement, options: TransitionOptions) => {
  const style = options.style || {};
  const computed = getComputedStyle(element);
  const from: Keyframe = {};
  const to: Keyframe = {};

  for (const propName in style) {
    let value: string = style[propName];
    if (typeof value === 'number' && propName !== 'opacity') {
      (value as string) += 'px';
    }

    let key: string;
    if (/^--/.test(propName)) {
      key = propName;
      from[key] = element.style.getPropertyValue(propName);
      element.style.setProperty(key, (to[key] = value));
    } else {
      if (propName === 'transform') {
        key = propName;
        value =
          ('' + value || '').replace(/\w+\((?:0\w*\s*)+\)\s*/g, '') || 'none';
      } else {
        key = propName.replace(/[A-Z]/g, '-$&').toLowerCase();
      }

      from[key] = computed[key];
      element.style[key] = to[key] = value;
    }
  }

  const effect: KeyframeEffectOptions = {
    duration:
      typeof options.duration === 'number'
        ? options.duration * 1000
        : options.duration || 1000,
    easing: Array.isArray(options.easing)
      ? `cubic-bezier(${options.easing.join(', ')})`
      : options.easing || 'ease',
  };

  const prevAnimation = animations.get(element);
  if (prevAnimation) prevAnimation.cancel();

  const animation = element.animate([from, to], effect);
  animation.playbackRate = 1.000001;
  animation.currentTime = 0.1;

  let animating = false;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  if (!media.matches) {
    for (const propName in from) {
      const value = /^--/.test(propName)
        ? element.style.getPropertyValue(propName)
        : computed[propName];
      if (value !== from[propName]) {
        animating = true;
        break;
      }
    }
  }

  if (!animating) {
    animations.delete(element);
    animation.cancel();
    return;
  }

  return new Promise<unknown>((resolve, reject) => {
    animations.set(element, animation);
    animation.addEventListener('cancel', reject);
    animation.addEventListener('finish', resolve);
  });
};

export function useStyleTransition<T extends HTMLElement>(
  ref: Ref<T>,
  options?: TransitionOptions
): [boolean, (options: TransitionOptions) => Promise<void>] {
  if (!options) options = {};

  const style = options.style || {};
  const [state, setState] = useState<[boolean, Style]>([false, style]);
  if (JSON.stringify(style) !== JSON.stringify(state[1])) {
    setState([true, style]);
  }

  const animateTo = useCallback(
    (options: TransitionOptions) => {
      const updateAnimating = (animating: boolean) => {
        setState(state =>
          state[0] !== animating ? [animating, state[1]] : state
        );
      };

      const animation = animate(ref.current!, options);
      if (animation) {
        updateAnimating(true);
        return animation
          .then(() => {
            updateAnimating(false);
          })
          .catch(() => {});
      } else {
        updateAnimating(false);
        return Promise.resolve();
      }
    },
    [ref]
  );

  useLayoutEffect(() => {
    animateTo(options!);
  }, [animateTo, state[1]]);

  return [state[0], animateTo];
}
