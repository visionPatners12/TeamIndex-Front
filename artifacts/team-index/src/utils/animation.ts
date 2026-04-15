export const ANIMATION = {
  once: true,
  y: 20,
  duration: 0.8,
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const;

export const fadeInUp = {
  initial: { y: ANIMATION.y, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  transition: { duration: ANIMATION.duration, ease: ANIMATION.ease },
  viewport: { once: ANIMATION.once, amount: 0.2 },
};

export const fadeInLeft = {
  initial: { x: -ANIMATION.y, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  transition: { duration: ANIMATION.duration, ease: ANIMATION.ease },
  viewport: { once: ANIMATION.once, amount: 0.2 },
};

export const fadeInRight = {
  initial: { x: ANIMATION.y, opacity: 0 },
  whileInView: { x: 0, opacity: 1 },
  transition: { duration: ANIMATION.duration, ease: ANIMATION.ease },
  viewport: { once: ANIMATION.once, amount: 0.2 },
};

export const staggerDelay = (index: number, base = 0.1) => ({
  ...fadeInUp,
  transition: { duration: ANIMATION.duration, delay: index * base, ease: ANIMATION.ease },
});
