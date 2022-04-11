import type { Style, Ref } from './types';
import { useState, useCallback } from 'react';
import { useLayoutEffect } from './utils/react';

interface AnimationState {
  animation: Animation;
  to: Keyframe;
}

const animations = new WeakMap<HTMLElement, AnimationState>();

export interface TransitionOptions {
  style: Style;
  duration?: number | string;
  easing?: string | [number, number, number, number];
}

const animate = (element: HTMLElement, options: TransitionOptions) => {
  const prevState = animations.get(element);
  const prevTo = prevState ? prevState.to : {};
  const computed = getComputedStyle(element);
  const from: Keyframe = {};
  const to: Keyframe = {};

  let changed = !prevState;
  for (const propName in options.style) {
    let value: string = options.style[propName];
    if (typeof value === 'number') (value as string) += 'px';

    let key: string;
    if (/^--/.test(propName)) {
      key = propName;
      from[key] = element.style.getPropertyValue(propName);
      element.style.setProperty(key, (to[key] = options.style[propName]));
    } else {
      if (propName === 'float') {
        key = 'cssFloat';
      } else if (propName === 'offset') {
        key = 'cssOffset';
      } else if (propName === 'transform') {
        key = propName;
        value =
          ('' + value || '').replace(/\w+\((?:0\w*\s*)+\)\s*/g, '') || 'none';
      } else {
        key = propName.replace(/[A-Z]/g, '-$&').toLowerCase();
      }

      from[key] = computed[key];
      element.style[key] = to[key] = value;
    }

    changed = changed || prevState!.to[key] !== to[key];
  }

  if (!changed && Object.keys(to).length === Object.keys(prevTo).length) return;

  const effect: KeyframeEffectOptions = {
    duration:
      typeof options.duration === 'number'
        ? options.duration * 1000
        : options.duration,
    easing: Array.isArray(options.easing)
      ? `cubic-bezier(${options.easing.join(', ')})`
      : options.easing,
  };

  if (prevState) prevState.animation.cancel();

  const animation = element.animate([from, to], effect);
  animation.playbackRate = 1.000001;
  animation.currentTime = 0.1;

  let animating = false;
  for (const propName in from) {
    const value = /^--/.test(propName)
      ? element.style.getPropertyValue(propName)
      : computed[propName];
    if (value !== from[propName]) {
      animating = true;
      break;
    }
  }

  if (!animating) {
    animations.delete(element);
    animation.cancel();
    return;
  }

  return new Promise<unknown>((resolve, reject) => {
    animations.set(element, { animation, to });
    animation.addEventListener('cancel', reject);
    animation.addEventListener('finish', resolve);
  });
};

export function useTransition<T extends HTMLElement>(
  ref: Ref<T>,
  options: TransitionOptions
): [boolean, (options: TransitionOptions) => Promise<void>] {
  const [animating, setAnimating] = useState(false);

  const animateTo = useCallback(
    (options: TransitionOptions) => {
      const animation = animate(ref.current!, options);
      if (animation) {
        setAnimating(true);
        return animation
          .then(() => {
            setAnimating(false);
          })
          .catch(() => {});
      } else {
        return Promise.resolve();
      }
    },
    [ref]
  );

  useLayoutEffect(() => {
    animateTo(options);
  }, [animateTo, options.style]);

  return [animating, animateTo];
}
