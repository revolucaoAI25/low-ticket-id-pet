import 'server-only';
import type { Bump, SiteSettings } from '@/config/site';
import { normalize } from '@/lib/teams';

const kw = (b: Bump) => b.keywords.split(',').map(normalize).filter(Boolean);

/** Bumps citados em qualquer parte do pedido (nome do produto ou lista de itens). */
export function bumpsInPayload(text: string, settings: SiteSettings): string[] {
  const t = normalize(text);
  return settings.bumps.filter((b) => kw(b).some((k) => t.includes(k))).map((b) => b.id);
}

/** O produto do pedido é o próprio bump (Kiwify mandou o bump como pedido separado)? */
export function productIsBump(productName: string, settings: SiteSettings): boolean {
  const n = normalize(productName);
  return settings.bumps.some((b) => kw(b).some((k) => n.includes(k)));
}

export function bumpFiles(ids: string[] | null | undefined, settings: SiteSettings): { label: string; url: string }[] {
  const set = new Set(ids ?? []);
  return settings.bumps.filter((b) => set.has(b.id) && b.file).map((b) => ({ label: b.name, url: b.file }));
}
