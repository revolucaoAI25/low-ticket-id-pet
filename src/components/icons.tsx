'use client';

import { Bird, Cat, Compass, Dog, Drumstick, Fish, Heart, Moon, PawPrint, Rabbit, Volleyball, type LucideIcon } from 'lucide-react';
import type { Personality } from '@/lib/pet';
import type { Species } from '@/lib/species';

export const SPECIES_ICON: Record<Species, LucideIcon> = {
  cachorro: Dog,
  gato: Cat,
  passaro: Bird,
  peixe: Fish,
  roedor: Rabbit,
  outro: PawPrint,
};

export const PERSONALITY_ICON: Record<Personality, LucideIcon> = {
  aventureiro: Compass,
  dorminhoco: Moon,
  comilao: Drumstick,
  brincalhao: Volleyball,
  grudinho: Heart,
};

/** Ícone dentro de um círculo suave (vira roxo quando selecionado). */
export function IconBubble({ icon: Icon, selected, size = 'md' }: { icon: LucideIcon; selected?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-10 w-10' : 'h-12 w-12';
  const ic = size === 'lg' ? 30 : size === 'sm' ? 20 : 24;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${box} ${selected ? 'bg-roxo text-white' : 'bg-[#F7EEF8] text-roxo'}`}>
      <Icon size={ic} strokeWidth={2.2} />
    </span>
  );
}
