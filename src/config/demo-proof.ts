import type { Review, SiteSettings } from './site';

/**
 * AVALIAÇÕES DE DEMONSTRAÇÃO (inventadas) — só para mockup e testes.
 * Aparecem apenas com "Modo demonstração" ligado em /admin → Prova social.
 * Desligue antes de anunciar: avaliação inventada para cliente real é propaganda enganosa.
 */
export const DEMO_REVIEWS: Review[] = [
  { name: 'Juliana Martins', city: 'Belo Horizonte - MG', petName: 'Thor', stars: 5, text: 'Gente, que coisa mais linda!! Imprimi o RG do Thor ontem e plastifiquei, ficou perfeito. Meu marido adorou a CNH, vale cada centavo' },
  { name: 'Camila Rocha', city: 'Recife - PE', petName: 'Mel', stars: 5, text: 'Comprei achando que ia ser uma coisinha simples e me surpreendi. A carteira de vacinação dobrável é muito caprichada, levei na veterinária e ela amou.' },
  { name: 'Fernanda Oliveira', city: 'Curitiba - PR', petName: 'Bolinha', stars: 5, text: 'A tag de ossinho com QR Code foi o que me fez comprar. Testei com o celular da minha mãe e abriu a identidade da Bolinha certinho. Tô bem mais tranquila nos passeios.' },
  { name: 'Patrícia Souza', city: 'Salvador - BA', petName: 'Pipoca', stars: 5, text: 'A carteirinha de torcedor do Pipoca com o escudo do Bahia ficou sensacional kkkk virou foto de perfil da família inteira' },
  { name: 'Ana Paula Lima', city: 'São Paulo - SP', petName: 'Luna', stars: 5, text: 'Chegou tudo no e-mail na hora, num PDF só e com instrução de como montar. Montei com minha filha de 8 anos, foi o programa do domingo ❤️' },
];

export const DEMO_TUTORS = 1287;

/** Aplica a demonstração só nas páginas públicas (o painel continua mostrando os dados reais). */
export function withDemoProof(s: SiteSettings): SiteSettings {
  // Liga pelo painel, ou com a variável DEMO_PROOF=1 (útil em deploy de teste).
  if (!s.proof.demo && process.env.DEMO_PROOF !== '1') return s;
  return {
    ...s,
    tutorsCount: s.tutorsCount || DEMO_TUTORS,
    proof: { ...s.proof, reviews: s.proof.reviews.length ? s.proof.reviews : DEMO_REVIEWS },
  };
}
