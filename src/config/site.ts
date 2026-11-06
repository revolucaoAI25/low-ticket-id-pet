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
    /** Calendário de Saúde: um PDF só, com cão, gato e outros pets. */
    calendario: string;
    guiaViagem: string;
    /** Antigos (um por espécie): ainda valem se o único não foi enviado. */
    calendarioCao?: string;
    calendarioGato?: string;
    calendarioOutros?: string;
  };
  proof: {
    /** Modo demonstração: mostra avaliações de exemplo enquanto não há reais. DESLIGAR antes de anunciar. */
    demo: boolean;
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
  files: { calendario: '/arquivos/87a545c86b7b38d3/Calendario-de-Saude-por-Idade.pdf', guiaViagem: '/arquivos/87a545c86b7b38d3/Guia-Como-Viajar-com-seu-Pet.pdf' },
  proof: { demo: false, avatars: [], realLife: [], whatsapp: [], instagram: [], reviews: [] },
  extraTeams: [],
  exitOffer: { enabled: true, price: 14.9, checkout: { cachorro: '', gato: '', outros: '' } },
  bumps: [
    { id: 'pet-calmo', name: 'Método Pet Calmo: Fim do Choro Quando Você Sai', keywords: 'pet calmo', file: '/arquivos/87a545c86b7b38d3/Metodo-Pet-Calmo.pdf' },
    { id: 'comida-que-cuida', name: 'Guia Comida que Cuida: o que Pode Envenenar seu Pet', keywords: 'comida que cuida', file: '/arquivos/87a545c86b7b38d3/Guia-Comida-que-Cuida.pdf' },
    { id: 'sos-pet', name: 'Manual SOS Pet: Primeiros Socorros que Salvam Vidas', keywords: 'sos pet', file: '/arquivos/87a545c86b7b38d3/Manual-SOS-Pet.pdf' },
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

/** Bumps antigos (por espécie) que saíram da oferta: são removidos mesmo se estiverem salvos no painel. */
const RETIRED_BUMPS = new Set(['petiscos-cao', 'xixi', 'latidos', 'petiscos-gato', 'areia', 'arranhar', 'album', 'cuidados']);

function currentBumps(saved?: Bump[]): Bump[] {
  // Bump sem PDF enviado no painel usa o PDF que já vem no site (public/arquivos).
  const kept = (saved ?? []).filter((b) => !RETIRED_BUMPS.has(b.id)).map((b) => (b.file ? b : { ...b, file: defaultSettings.bumps.find((d) => d.id === b.id)?.file ?? '' }));
  // Garante os 3 bumps atuais (mantém nome/arquivo se já foram editados no painel).
  const ids = new Set(kept.map((b) => b.id));
  return [...kept, ...defaultSettings.bumps.filter((b) => !ids.has(b.id))];
}

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
    files: {
      ...defaultSettings.files,
      ...(s.files ?? {}),
      // Vazio no painel = usa o PDF que já vem no site.
      calendario: s.files?.calendario || defaultSettings.files.calendario,
      guiaViagem: s.files?.guiaViagem || defaultSettings.files.guiaViagem,
    },
    proof: { ...defaultSettings.proof, ...(s.proof ?? {}) },
    extraTeams: s.extraTeams ?? [],
    bumps: currentBumps(s.bumps),
    exitOffer: { ...defaultSettings.exitOffer, ...(s.exitOffer ?? {}), checkout: { ...defaultSettings.exitOffer.checkout, ...(s.exitOffer?.checkout ?? {}) } },
    extraPetKeywords: s.extraPetKeywords?.length ? s.extraPetKeywords : defaultSettings.extraPetKeywords,
  };
}
