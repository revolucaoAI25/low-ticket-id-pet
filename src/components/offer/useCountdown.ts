'use client';

import { useEffect, useState } from 'react';
import { quizStore } from '@/lib/quiz-store';

/** Timer do "desconto reservado". Guarda o fim no navegador para não reiniciar ao recarregar. */
export function useCountdown(minutes: number): { left: number; label: string } {
  const [left, setLeft] = useState(minutes * 60);

  useEffect(() => {
    let end = quizStore.get().timerEnd;
    if (!end || end < Date.now() - 24 * 3600_000) {
      end = Date.now() + minutes * 60_000;
      quizStore.set({ timerEnd: end });
    }
    const tick = () => setLeft(Math.max(0, Math.round((end! - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [minutes]);

  const m = Math.floor(left / 60);
  const s = left % 60;
  return { left, label: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
}
