import type { PetData } from './pet';

/** Pet de exemplo (mockup da abertura e página /p/exemplo). */
export const SAMPLE_PET: PetData = {
  species: 'cachorro',
  name: 'Paçoca',
  breed: 'SRD (vira-lata)',
  sex: 'macho',
  personality: 'aventureiro',
  origin: 'adocao',
  date: '2022-03-14',
  place: 'praia',
  team: { id: 'flamengo', name: 'Flamengo' },
  tutors: 'Ana e Léo',
  city: 'Belo Horizonte - MG',
  rgColor: 'azul',
};
