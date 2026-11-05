'use client';

import { useSyncExternalStore } from 'react';
import { normalizePet, type PetData } from './pet';

export interface Contact {
  phone: string;
  email: string;
  consent: boolean;
}

export interface LeadRef {
  token: string;
  petId: string;
  slug: string;
}

export interface QuizState {
  v: 1;
  step: number;
  /** Maior etapa já vista (para a barra de progresso não "voltar" ao pular). */
  maxStep: number;
  pet: PetData;
  contact: Contact;
  lead?: LeadRef;
  /** Quando termina o desconto reservado (timestamp). */
  timerEnd?: number;
  updatedAt: number;
}

const KEY = 'cdf:quiz:v1';
// v1 guardava tutores em texto e cidade solta: normalizePet converte ao carregar.

const empty: QuizState = {
  v: 1,
  step: 0,
  maxStep: 0,
  pet: {},
  contact: { phone: '', email: '', consent: false },
  updatedAt: 0,
};

let state: QuizState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuizState;
      if (parsed?.v === 1) state = { ...empty, ...parsed, pet: normalizePet(parsed.pet), contact: { ...empty.contact, ...parsed.contact } };
    }
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sem espaço (foto grande): salva sem a foto para não perder o resto.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, pet: { ...state.pet, photo: state.pet.photo?.startsWith('http') ? state.pet.photo : undefined } }));
    } catch {
      /* ignore */
    }
  }
}

export const quizStore = {
  get(): QuizState {
    load();
    return state;
  },
  set(patch: Partial<QuizState> | ((s: QuizState) => Partial<QuizState>)) {
    load();
    const p = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...p, updatedAt: Date.now() };
    persist();
    listeners.forEach((l) => l());
  },
  setPet(p: Partial<PetData>) {
    quizStore.set((s) => ({ pet: { ...s.pet, ...p } }));
  },
  reset() {
    state = { ...empty, updatedAt: Date.now() };
    persist();
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

const serverSnapshot = () => empty;

export function useQuiz(): QuizState {
  return useSyncExternalStore(quizStore.subscribe, quizStore.get, serverSnapshot);
}

/** true depois que o localStorage foi lido no navegador (evita piscar o estado vazio). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    quizStore.subscribe,
    () => true,
    () => false,
  );
}
