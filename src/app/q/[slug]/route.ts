import { fichaPath } from '@/lib/server/supabase';

/**
 * Link curto do QR Code da tag. Redireciona para a imagem estática da identidade do pet
 * (gerada uma vez, na confirmação). Sem página, sem banco: só um redirecionamento.
 */
export function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const base = process.env.SUPABASE_URL;
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    if (!base || !clean || clean === 'exemplo') return Response.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), 302);
    return Response.redirect(`${base.replace(/\/$/, '')}/storage/v1/object/public/kits/${fichaPath(clean)}`, 302);
  });
}
