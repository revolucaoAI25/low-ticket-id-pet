export type Species = 'cachorro' | 'gato' | 'passaro' | 'peixe' | 'roedor' | 'outro';
export type CheckoutGroup = 'cachorro' | 'gato' | 'outros';

export interface SpeciesDef {
  id: Species;
  label: string;
  /** "seu cachorro", "sua calopsita"… usado quando ainda não tem nome. */
  noun: string;
  emoji: string;
  group: CheckoutGroup;
  breeds: string[];
  /** Linhas da carteira de vacinação. */
  vaccines: string[];
  /** Tratamentos extras (vermífugo, antipulgas…) */
  treatments: string[];
}

const SRD = 'SRD (vira-lata)';

export const SPECIES: SpeciesDef[] = [
  {
    id: 'cachorro',
    label: 'Cachorro',
    noun: 'cachorro',
    emoji: '🐶',
    group: 'cachorro',
    breeds: [
      SRD, 'Shih-tzu', 'Yorkshire', 'Poodle', 'Lhasa Apso', 'Spitz Alemão (Lulu)', 'Golden Retriever',
      'Labrador', 'Pinscher', 'Maltês', 'Bulldog Francês', 'Bulldog Inglês', 'Pug', 'Dachshund (Salsicha)',
      'Beagle', 'Border Collie', 'Pastor Alemão', 'Rottweiler', 'Pit Bull', 'American Bully', 'Husky Siberiano',
      'Chihuahua', 'Schnauzer', 'Cocker Spaniel', 'Boxer', 'Chow Chow', 'Akita', 'Shiba Inu', 'Dálmata',
      'Basset Hound', 'Pastor Belga', 'Doberman', 'Cane Corso', 'Bernese', 'Samoieda', 'Weimaraner',
      'Jack Russell', 'Fox Paulistinha', 'Bichon Frisé', 'Cavalier King Charles', 'Corgi', 'Galgo',
      'Fila Brasileiro', 'Dogue Alemão', 'São Bernardo', 'Sharpei', 'Whippet',
    ],
    vaccines: ['V8 / V10 (polivalente)', 'Antirrábica', 'Gripe canina (tosse dos canis)', 'Giárdia', 'Leishmaniose'],
    treatments: ['Vermífugo', 'Antipulgas e carrapatos'],
  },
  {
    id: 'gato',
    label: 'Gato',
    noun: 'gato',
    emoji: '🐱',
    group: 'gato',
    breeds: [
      SRD, 'Siamês', 'Persa', 'Maine Coon', 'Angorá', 'Sphynx', 'Ragdoll', 'British Shorthair', 'Bengal',
      'Himalaio', 'Exótico', 'Scottish Fold', 'Azul Russo', 'Sagrado da Birmânia', 'Savannah', 'Siberiano',
      'Munchkin', 'Abissínio', 'Bombaim', 'Chartreux',
    ],
    vaccines: ['V3 / V4 / V5 (polivalente)', 'Antirrábica', 'FeLV (leucemia felina)'],
    treatments: ['Vermífugo', 'Antipulgas'],
  },
  {
    id: 'passaro',
    label: 'Pássaro',
    noun: 'pássaro',
    emoji: '🦜',
    group: 'outros',
    breeds: [
      'Calopsita', 'Periquito-australiano', 'Agapornis', 'Canário', 'Papagaio', 'Cacatua', 'Ring Neck',
      'Manon', 'Diamante-mandarim', 'Arara', 'Maritaca', 'Lóris', 'Pomba / Pombo', 'Galinha',
    ],
    vaccines: [],
    treatments: ['Vermífugo', 'Check-up', 'Corte de unhas / bico'],
  },
  {
    id: 'peixe',
    label: 'Peixe',
    noun: 'peixe',
    emoji: '🐠',
    group: 'outros',
    breeds: ['Betta', 'Kinguio (peixe-dourado)', 'Guppy (lebiste)', 'Neon', 'Platy', 'Molly', 'Acará-bandeira', 'Carpa', 'Oscar', 'Tetra', 'Corydora', 'Disco'],
    vaccines: [],
    treatments: ['Troca parcial de água', 'Limpeza do filtro', 'Teste da água'],
  },
  {
    id: 'roedor',
    label: 'Roedor ou coelho',
    noun: 'bichinho',
    emoji: '🐹',
    group: 'outros',
    breeds: [
      'Hamster sírio', 'Hamster anão russo', 'Porquinho-da-índia', 'Coelho', 'Coelho mini lop', 'Chinchila',
      'Gerbil (esquilo-da-mongólia)', 'Twister (rato doméstico)', 'Degu', 'Furão (ferret)',
    ],
    vaccines: [],
    treatments: ['Vermífugo', 'Check-up', 'Corte de dentes / unhas'],
  },
  {
    id: 'outro',
    label: 'Outro pet',
    noun: 'pet',
    emoji: '🐾',
    group: 'outros',
    breeds: ['Jabuti', 'Tartaruga', 'Iguana', 'Gecko', 'Cobra', 'Mini pig', 'Cavalo', 'Ouriço', 'Cabra', 'Pato'],
    vaccines: [],
    treatments: ['Vermífugo', 'Check-up'],
  },
];

export function getSpecies(id?: string | null): SpeciesDef | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function checkoutGroup(id?: string | null): CheckoutGroup {
  return getSpecies(id)?.group ?? 'outros';
}
