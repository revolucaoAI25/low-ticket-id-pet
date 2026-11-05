import type { PetData } from './pet';

/** Pet de exemplo (mockup da abertura e conferência dos modelos no painel). */
export const SAMPLE_PET: PetData = {
  species: 'cachorro',
  name: 'Paçoca',
  breed: 'SRD (vira-lata)',
  sex: 'macho',
  personality: 'aventureiro',
  origin: 'adocao',
  date: '2022-03-14',
  team: { id: 'flamengo', name: 'Flamengo' },
  tutors: [{ name: 'Ana Souza', phone: '31999990000' }, { name: 'Léo Lima' }],
  address: { street: 'Rua das Flores, 120', district: 'Santa Tereza', city: 'Belo Horizonte - MG' },
};
