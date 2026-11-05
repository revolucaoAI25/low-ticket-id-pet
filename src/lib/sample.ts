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

/** Pets-modelo dos exemplos na página de oferta: um pet diferente por documento (fotos reais CC0 em public/demo/pets). */
const base = (o: PetData): PetData => ({ team: { id: null, name: '', none: true }, ...o });

export const EXAMPLE_PETS: Record<string, PetData> = {
  rg: base({ species: 'cachorro', name: 'Mel', breed: 'Shih-tzu', sex: 'femea', personality: 'grudinho', origin: 'nascimento', date: '2022-09-04', tutors: [{ name: 'Juliana Martins', phone: '31999990000' }], address: { city: 'Belo Horizonte - MG', street: 'Rua das Flores, 120' }, extras: { coat: 'Caramelo e branco', microchip: '985112004567890' }, photo: '/demo/pets/mel.jpg' }),
  cnh: base({ species: 'cachorro', name: 'Thor', breed: 'Labrador', sex: 'macho', personality: 'aventureiro', origin: 'adocao', date: '2021-05-10', tutors: [{ name: 'Rafael Souza' }, { name: 'Bianca Souza' }], address: { city: 'Curitiba - PR' }, extras: { microchip: '985112009876543' }, photo: '/demo/pets/thor.jpg' }),
  certidao: base({ species: 'gato', name: 'Nina', breed: 'Siamês', sex: 'femea', personality: 'dorminhoco', origin: 'nascimento', date: '2023-03-21', tutors: [{ name: 'Camila Rocha' }], address: { city: 'Recife - PE' }, photo: '/demo/pets/nina.jpg' }),
  passaporte: base({ species: 'cachorro', name: 'Bob', breed: 'Labrador', sex: 'macho', personality: 'brincalhao', origin: 'nascimento', date: '2020-11-02', tutors: [{ name: 'Marcos Lima' }], address: { city: 'Florianópolis - SC' }, photo: '/demo/pets/bob.jpg' }),
  tag: base({ species: 'cachorro', name: 'Pipoca', breed: 'Yorkshire', sex: 'femea', personality: 'brincalhao', origin: 'adocao', date: '2022-01-15', tutors: [{ name: 'Ana Paula Lima', phone: '11999990000' }], address: { city: 'São Paulo - SP' }, photo: '/demo/pets/pipoca.jpg' }),
  vacina: base({ species: 'gato', name: 'Luna', breed: 'SRD (vira-lata)', sex: 'femea', personality: 'grudinho', origin: 'adocao', date: '2023-06-18', tutors: [{ name: 'Patrícia Souza' }], address: { city: 'Salvador - BA' }, extras: { coat: 'Rajada' }, photo: '/demo/pets/luna.jpg' }),
  torcedor: base({ species: 'cachorro', name: 'Fred', breed: 'Dachshund', sex: 'macho', personality: 'comilao', origin: 'nascimento', date: '2021-08-30', tutors: [{ name: 'Fernanda Oliveira' }], address: { city: 'Porto Alegre - RS' }, photo: '/demo/pets/fred.jpg' }),
};

export const EXAMPLE_DOG = EXAMPLE_PETS.rg;
export const EXAMPLE_CAT = EXAMPLE_PETS.vacina;
export const examplePetFor = (species?: string): PetData => (species === 'gato' ? EXAMPLE_CAT : EXAMPLE_DOG);
