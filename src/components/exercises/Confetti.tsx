import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const GOLD_COLORS = ['#D4A843', '#F5D77A', '#C9983A', '#FFE8A0', '#B8860B'];

export function fireCorrectConfetti() {
  confetti({
    particleCount: 40,
    spread: 60,
    origin: { y: 0.7 },
    colors: GOLD_COLORS,
    ticks: 80,
    gravity: 1.2,
    scalar: 0.9,
  });
}

export function firePerfectScoreConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: GOLD_COLORS,
      ticks: 200,
      gravity: 0.8,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: GOLD_COLORS,
      ticks: 200,
      gravity: 0.8,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

export function PerfectScoreConfetti() {
  useEffect(() => {
    firePerfectScoreConfetti();
  }, []);
  return null;
}
