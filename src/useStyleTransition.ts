import type { Style, Ref } from './types';
import { useState, useCallback } from 'react';
import { useLayoutEffect } from './utils/react';

const animations = new WeakMap<HTMLElement, Animation>();

export interface TransitionOptions {
  to?: Style | null;
  final?: Style | null;
  duration?: number | string;
  easing?: string | [number, number, number, number];
}

const applyKeyframe = (
  element: HTMLElement,
  style: Style
): [Keyframe, Keyframe] => {
  const computed = getComputedStyle(element);
  const from: Keyframe = {};
  const to: Keyframe = {};

  for (const propName in style) {
    let key: string;
    let value: string =
      style[propName] +
      (typeof style[propName] === 'number' && propName !== 'opacity'
        ? 'px'
        : '');
    if (/^--/.test(propName)) {
      key = propName;
      from[key] = element.style.getPropertyValue(propName);
      element.style.setProperty(key, value);
    } else {
      if (propName === 'transform') {
        key = propName;
        value =
          ('' + value || '').replace(/\w+\((?:0\w*\s*)+\)\s*/g, '') || 'none';
      } else {
        key = propName.replace(/[A-Z]/g, '-$&').toLowerCase();
      }

      from[key] = computed[key];
      element.style[key] = value;
    }

    if (from[key] !== value) to[key] = value;
  }

  return [from, to];
};

const animate = (element: HTMLElement, options: TransitionOptions) => {
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

  const keyframes = applyKeyframe(element, options.to || {});
  const animation = element.animate(keyframes, effect);

  animation.playbackRate = 1.000001;
  animation.currentTime = 0.1;

  let animating = false;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const computed = getComputedStyle(element);
  if (!media.matches) {
    for (const propName in keyframes[1]) {
      const value = /^--/.test(propName)
        ? element.style.getPropertyValue(propName)
        : computed[propName];
      if (value !== keyframes[0][propName]) {
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

  const promise = new Promise<unknown>((resolve, reject) => {
    animations.set(element, animation);
    animation.addEventListener('cancel', reject);
    animation.addEventListener('finish', resolve);
  });

  if (options.final) {
    return promise.then(() => {
      applyKeyframe(element, options.final!);
    });
  }

  return promise;
};

export function useStyleTransition<T extends HTMLElement>(
  ref: Ref<T>,
  options?: TransitionOptions
): [boolean, (options: TransitionOptions) => Promise<void>] {
  if (!options) options = {};

  const style = options.to || {};
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
