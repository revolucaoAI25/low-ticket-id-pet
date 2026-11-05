import type { Review, SiteSettings } from './site';

/**
 * AVALIAÇÕES DE DEMONSTRAÇÃO (inventadas) — só para mockup e testes.
 * Aparecem apenas com "Modo demonstração" ligado em /admin → Prova social.
 * Desligue antes de anunciar: avaliação inventada para cliente real é propaganda enganosa.
 */
export const DEMO_REVIEWS: Review[] = [
  { name: 'Juliana Martins', city: 'Belo Horizonte - MG', petName: 'Thor', stars: 5, text: 'Gente, que coisa mais linda!! Imprimi o RG do Thor ontem e plastifiquei, ficou perfeito. Meu marido riu muito da CNH kkkk vale cada centavo' },
  { name: 'Camila Rocha', city: 'Recife - PE', petName: 'Mel', stars: 5, text: 'Comprei achando que ia ser uma coisinha simples e me surpreendi. A carteira de vacinação dobrável é muito caprichada, levei na veterinária e ela amou.' },
  { name: 'Fernanda Oliveira', city: 'Curitiba - PR', petName: 'Bolinha', stars: 5, text: 'A tag de ossinho com QR Code foi o que me fez comprar. Testei com o celular da minha mãe e abriu a identidade da Bolinha certinho. Tô bem mais tranquila nos passeios.' },
  { name: 'Patrícia Souza', city: 'Salvador - BA', petName: 'Pipoca', stars: 5, text: 'kkkkk a carteirinha de torcedor do Pipoca com o escudo do Bahia ficou sensacional, virou foto de perfil da família inteira' },
  { name: 'Ana Paula Lima', city: 'São Paulo - SP', petName: 'Luna', stars: 5, text: 'Chegou tudo no e-mail na hora, num PDF só e com instrução de como montar. Montei com minha filha de 8 anos, foi o programa do domingo ❤️' },
  { name: 'Renata Alves', city: 'Goiânia - GO', petName: 'Fred', stars: 5, text: 'Muito barato pelo tanto de coisa que vem. O passaporte parece de verdade, até a página de dados com a fotinho dele kkk' },
  { name: 'Larissa Mendes', city: 'Porto Alegre - RS', petName: 'Nina', stars: 5, text: 'Adotei a Nina há 2 anos e a certidão de adoção me fez chorar kkk ficou linda emoldurada na sala.' },
  { name: 'Marcos e Bia', city: 'Campinas - SP', petName: 'Paçoca e Feijão', stars: 5, text: 'Fizemos o kit dos dois (peguei o +1 pet). Saiu tudo perfeito, as cores do RG e da CNH ficaram lindas impressas.' },
  { name: 'Daniela Costa', city: 'Fortaleza - CE', petName: 'Amora', stars: 5, text: 'Tenho gata e achei que não ia ter opção, mas veio tudo certinho com as vacinas de gato. A CNH dela é categoria D, dona do sofá kkkkk' },
  { name: 'Vanessa Ribeiro', city: 'Rio de Janeiro - RJ', petName: 'Zeca', stars: 5, text: 'O kit de aniversário salvou a festinha do Zeca! Topo de bolo e plaquinhas lindas, todo mundo perguntou onde eu tinha mandado fazer.' },
  { name: 'Thiago Nunes', city: 'Florianópolis - SC', petName: 'Bento', stars: 5, text: 'Comprei de presente pra minha namorada e ela surtou kkkk. Tive dúvida pra imprimir e me responderam rapidinho.' },
  { name: 'Priscila Gomes', city: 'Manaus - AM', petName: 'Lola', stars: 5, text: 'Simples de fazer, respondi umas perguntinhas e pronto. Qualidade de impressão excelente, recomendo demais!' },
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
