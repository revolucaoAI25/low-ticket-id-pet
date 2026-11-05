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

/** Pets-modelo dos exemplos na página de oferta (fotos em public/demo). */
export const EXAMPLE_DOG: PetData = {
  species: 'cachorro',
  name: 'Thor',
  breed: 'Golden Retriever',
  sex: 'macho',
  personality: 'brincalhao',
  origin: 'nascimento',
  date: '2024-02-10',
  team: { id: 'flamengo', name: 'Flamengo' },
  tutors: [{ name: 'Juliana Martins', phone: '31999990000' }],
  address: { city: 'Belo Horizonte - MG' },
  photo: '/demo/pet-cachorro.jpg',
};

export const EXAMPLE_CAT: PetData = {
  species: 'gato',
  name: 'Mia',
  breed: 'SRD (vira-lata)',
  sex: 'femea',
  personality: 'dorminhoco',
  origin: 'adocao',
  date: '2023-06-18',
  team: { id: 'palmeiras', name: 'Palmeiras' },
  tutors: [{ name: 'Camila Rocha', phone: '81999990000' }],
  address: { city: 'Recife - PE' },
  photo: '/demo/pet-gato.jpg',
};

export const examplePetFor = (species?: string): PetData => (species === 'gato' ? EXAMPLE_CAT : EXAMPLE_DOG);
