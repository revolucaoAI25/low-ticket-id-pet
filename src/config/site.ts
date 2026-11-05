/**
 * Configurações da oferta que podem ser trocadas pelo painel /admin (ficam salvas no Supabase).
 * Os valores abaixo são o padrão, usados enquanto nada foi salvo no painel.
 */

export interface ProofImage {
  url: string;
  caption?: string;
}

export interface Review {
  name: string;
  city: string;
  text: string;
  stars: number;
  photo?: string;
  petName?: string;
}

export interface ExtraTeam {
  id: string;
  name: string;
  aliases?: string;
  crest: string;
  primary: string;
  secondary: string;
}

/** Order bump de conteúdo (PDF pronto), entregue por e-mail e no fim do PDF do kit. */
export interface Bump {
  id: string;
  name: string;
  /** Palavras (sem acento, separadas por vírgula) que identificam o bump no webhook da Kiwify. */
  keywords: string;
  /** PDF enviado pelo painel. */
  file: string;
}

export interface SiteSettings {
  price: number;
  anchorPrice: number;
  timerMinutes: number;
  rating: number;
  tutorsCount: number;
  checkout: {
    cachorro: string;
    gato: string;
    outros: string;
    /** Checkout do "+1 pet" vendido depois da compra, dentro da área do pet. */
    extraPet: string;
  };
  /** Nomes dos parâmetros para preencher o checkout. Padrão Kiwify: name, email, phone. */
  checkoutParams: { name: string; email: string; phone: string };
  /**
   * Palavras que identificam o "+1 pet" no webhook (no nome do produto ou do order bump).
   * Sem acento, minúsculas. Ex.: "pet adicional".
   */
  extraPetKeywords: string[];
  tracking: {
    metaPixelId: string;
    utmifyUtms: boolean;
    utmifyPixelId: string;
  };
  support: { email: string; whatsapp: string; hours: string };
  company: { name: string; document: string };
  images: {
    heroMockup: string;
    /** Foto de exemplo do kit (com um pet de exemplo), mostrada em "O que vem no kit". */
    kitExample: string;
    bonusAniversario: string;
    bonusQuemCuida: string;
    bonusCalendario: string;
    bonusViagem: string;
    /** Fundos prontos dos documentos (quando a IA de imagens entregar). Chave = id do template. */
    templates: Record<string, string>;
  };
  files: {
    calendarioCao: string;
    calendarioGato: string;
    calendarioOutros: string;
    guiaViagem: string;
  };
  proof: {
    avatars: string[];
    realLife: ProofImage[];
    whatsapp: ProofImage[];
    instagram: ProofImage[];
    reviews: Review[];
  };
  extraTeams: ExtraTeam[];
  bumps: Bump[];
  /** Oferta extra quando a pessoa tenta sair da página de oferta. */
  exitOffer: {
    enabled: boolean;
    price: number;
    /** Checkouts com o preço extra (deixe vazio para usar o checkout normal). */
    checkout: { cachorro: string; gato: string; outros: string };
  };
}

export const defaultSettings: SiteSettings = {
  price: 19.9,
  anchorPrice: 67,
  timerMinutes: 10,
  rating: 4.9,
  tutorsCount: 0,
  checkout: {
    cachorro: '',
    gato: '',
    outros: '',
    extraPet: '',
  },
  checkoutParams: { name: 'name', email: 'email', phone: 'phone' },
  extraPetKeywords: ['pet adicional', '+1 pet', 'mais 1 pet', 'pet extra'],
  tracking: { metaPixelId: '', utmifyUtms: true, utmifyPixelId: '' },
  support: { email: 'contato@clubedofocinho.com.br', whatsapp: '', hours: 'Segunda a sexta, das 9h às 18h' },
  company: { name: 'Clube do Focinho', document: '' },
  images: {
    heroMockup: '',
    kitExample: '',
    bonusAniversario: '',
    bonusQuemCuida: '',
    bonusCalendario: '',
    bonusViagem: '',
    templates: {},
  },
  files: { calendarioCao: '', calendarioGato: '', calendarioOutros: '', guiaViagem: '' },
  proof: { avatars: [], realLife: [], whatsapp: [], instagram: [], reviews: [] },
  extraTeams: [],
  exitOffer: { enabled: true, price: 14.9, checkout: { cachorro: '', gato: '', outros: '' } },
  bumps: [
    { id: 'petiscos-cao', name: 'Petiscos Fit em 3 Ingredientes', keywords: 'petiscos fit em 3, petiscos fit 3 ingredientes', file: '' },
    { id: 'xixi', name: 'Xixi no Lugar Certo em 7 Dias', keywords: 'xixi no lugar certo', file: '' },
    { id: 'latidos', name: 'Fim dos Latidos Sem Gritar', keywords: 'fim dos latidos', file: '' },
    { id: 'petiscos-gato', name: 'Petiscos Fit para Gatos', keywords: 'petiscos fit para gatos', file: '' },
    { id: 'areia', name: 'Caixa de Areia Sem Cheiro', keywords: 'caixa de areia', file: '' },
    { id: 'arranhar', name: 'Gato Sem Arranhar o Sofá', keywords: 'arranhar o sofa', file: '' },
    { id: 'album', name: 'Álbum do Primeiro Ano do Pet', keywords: 'album do primeiro ano', file: '' },
    { id: 'cuidados', name: 'Guia de Cuidados Básicos por Espécie', keywords: 'cuidados basicos', file: '' },
  ],
};

/**
 * Espaços reservados de prova social. Enquanto o painel não tiver imagem real,
 * aparece uma caixa no tamanho certo com esta etiqueta. Nada de depoimento inventado.
 */
export const proofSlots = {
  realLife: [
    'Foto: RG impresso na mão do tutor, com o pet ao lado',
    'Foto: tag com QR pendurada na coleira',
    'Foto: passaporte de aventuras aberto com carimbo',
    'Foto: certidão emoldurada na parede',
    'Foto: carteirinha de torcedor com o pet de camisa',
    'Foto: kit completo espalhado na mesa',
  ],
  whatsapp: ['Print WhatsApp 1', 'Print WhatsApp 2', 'Print WhatsApp 3', 'Print WhatsApp 4'],
  instagram: ['Print comentário Instagram 1', 'Print comentário Instagram 2', 'Print comentário Instagram 3'],
  reviews: 6,
} as const;

/** Mescla o que veio do banco com o padrão (campos novos sempre têm valor). */
export function mergeSettings(saved: Partial<SiteSettings> | null | undefined): SiteSettings {
  const s = saved ?? {};
  return {
    ...defaultSettings,
    ...s,
    checkout: { ...defaultSettings.checkout, ...(s.checkout ?? {}) },
    checkoutParams: { ...defaultSettings.checkoutParams, ...(s.checkoutParams ?? {}) },
    tracking: { ...defaultSettings.tracking, ...(s.tracking ?? {}) },
    support: { ...defaultSettings.support, ...(s.support ?? {}) },
    company: { ...defaultSettings.company, ...(s.company ?? {}) },
    images: {
      ...defaultSettings.images,
      ...(s.images ?? {}),
      templates: { ...(s.images?.templates ?? {}) },
    },
    files: { ...defaultSettings.files, ...(s.files ?? {}) },
    proof: { ...defaultSettings.proof, ...(s.proof ?? {}) },
    extraTeams: s.extraTeams ?? [],
    bumps: s.bumps?.length ? s.bumps : defaultSettings.bumps,
    exitOffer: { ...defaultSettings.exitOffer, ...(s.exitOffer ?? {}), checkout: { ...defaultSettings.exitOffer.checkout, ...(s.exitOffer?.checkout ?? {}) } },
    extraPetKeywords: s.extraPetKeywords?.length ? s.extraPetKeywords : defaultSettings.extraPetKeywords,
  };
}
