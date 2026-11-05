import type { SiteSettings } from '@/config/site';
import type { DocContext } from './docs/types';
import type { PetData } from './pet';
import { siteUrl } from './site-url';
import { allTeams, findTeam } from './teams';

export function buildDocContext(o: {
  pet: PetData;
  settings: Pick<SiteSettings, 'extraTeams' | 'images'>;
  seed?: string;
  slug?: string;
  phone?: string;
  preview?: boolean;
}): DocContext {
  const teams = allTeams(o.settings.extraTeams);
  return {
    pet: o.pet,
    seed: o.seed || o.pet.name || 'pet',
    slug: o.slug,
    siteUrl: siteUrl(),
    team: findTeam(o.pet.team?.id, teams),
    phone: o.phone,
    templates: o.settings.images?.templates ?? {},
    preview: o.preview,
  };
}
