import 'server-only';
import { doPet, type PetData } from '@/lib/pet';
import { sendBumpEmail, sendConfirmEmail, sendKitEmail, type KitFile } from './email';
import { bumpFiles } from './bumps';
import { getSettings } from './settings';

interface CustomerWithPets {
  email: string | null;
  access_token: string;
  bumps?: string[] | null;
  pets?: { data: PetData; files: KitFile[] | null; submitted_at: string | null }[];
}

/** Links dos bônus em PDF fixo (Calendário e Guia). */
export async function fixedBonusLinks(pet: PetData): Promise<{ label: string; url: string }[]> {
  const f = (await getSettings()).files;
  // Um calendário só (cão, gato e outros). Os antigos por espécie ficam de reserva.
  const old = pet.species === 'gato' ? f.calendarioGato : pet.species === 'cachorro' ? f.calendarioCao : f.calendarioOutros || f.calendarioCao;
  const cal = f.calendario || old;
  return [
    ...(cal ? [{ label: 'Bônus: Calendário de Saúde por Idade (PDF)', url: cal }] : []),
    ...(f.guiaViagem ? [{ label: 'Bônus: Guia Como Viajar com seu Pet (PDF)', url: f.guiaViagem }] : []),
  ];
}

/**
 * Reenvia o que fizer sentido: o kit (para pets já gerados) ou o link de confirmação (se falta confirmar).
 */
export async function resendCustomer(c: CustomerWithPets): Promise<boolean> {
  if (!c.email) return false;
  const pets = c.pets ?? [];
  const done = pets.filter((p) => p.submitted_at && p.files?.length);
  let ok = false;
  for (const p of done) ok = (await sendKitEmail(c.email, doPet(p.data), p.files!, await fixedBonusLinks(p.data))) || ok;
  if (!pets.length || pets.some((p) => !p.submitted_at))
    ok = (await sendConfirmEmail(c.email, c.access_token, pets[0] ? doPet(pets[0].data) : undefined)) || ok;
  // Bumps de conteúdo: reenvia cada um no seu e-mail.
  for (const f of bumpFiles(c.bumps, await getSettings())) ok = (await sendBumpEmail(c.email, f)) || ok;
  return ok;
}
