/** O que vem no kit e os bônus. Os textos aceitam {nome} e {do} (ex.: "do Paçoca"). */

export interface OfferItem {
  id: string;
  /** id do documento no gerador (src/lib/docs). */
  doc?: string;
  title: string;
  /** Nome curto (miniaturas). */
  short: string;
  lines: [string, string];
  value: number;
  personalized?: boolean;
}

export const kitItems: OfferItem[] = [
  {
    id: 'rg',
    doc: 'rg',
    short: 'RG do Pet',
    title: 'RG do Pet',
    lines: ['Em versão verde e colorida (azul ou rosa), frente e verso, com foto e QR Code.', 'Nome, raça, pelagem, tutores, microchip e contato.'],
    value: 12,
  },
  {
    id: 'cnh',
    doc: 'cnh',
    short: 'CNH Pet',
    title: 'CNH Pet',
    lines: ['A carteira de habilitação mais divertida: categorias, validade "eterna" e tudo.', 'Com foto, nome e os tutores.'],
    value: 10,
  },
  {
    id: 'certidao',
    doc: 'certidao',
    short: 'Certidão',
    title: 'Certidão de {certidao}',
    lines: ['A história {do} num documento lindo pra emoldurar.', 'Foto, data, cidade e o nome dos tutores.'],
    value: 9,
  },
  {
    id: 'passaporte',
    doc: 'passaporte',
    short: 'Passaporte',
    title: 'Passaporte de Aventuras',
    lines: ['Livreto pra "carimbar" passeios e primeiras vezes.', 'Com foto, dados {do} e páginas de carimbos.'],
    value: 9,
  },
  {
    id: 'tag',
    doc: 'tag',
    short: 'Tag QR Code',
    title: 'Tag Ossinho com QR Code',
    lines: ['Quem encontrar {nome} escaneia e vê a identidade completa, com o seu contato.', 'Formato de ossinho, pronta pra recortar e pendurar na coleira.'],
    value: 12,
  },
  {
    id: 'vacina',
    doc: 'vacina',
    short: 'Vacinação',
    title: 'Carteira de Vacinação',
    lines: ['Dobrável em 3 partes, com foto: vacinas, vermífugo, antipulgas e peso.', 'Versão rosa ou azul, com as vacinas certas pra cada espécie.'],
    value: 8,
  },
  {
    id: 'torcedor',
    doc: 'torcedor',
    short: 'Torcedor',
    title: 'Carteirinha de Torcedor Pet',
    lines: ['"Torcedor oficial — Fã nº 1" com o escudo do time.', 'A carteirinha mais divertida da família.'],
    value: 7,
  },
];

export interface BonusItem {
  id: string;
  doc?: string;
  title: string;
  lines: [string, string];
  value: number;
  personalized: boolean;
  imageKey: 'bonusAniversario' | 'bonusQuemCuida' | 'bonusCalendario' | 'bonusViagem';
  emoji: string;
}

export const bonusItems: BonusItem[] = [
  {
    id: 'aniversario',
    doc: 'aniversario',
    title: 'Kit Aniversário {do}',
    lines: ['Convite, topo de bolo, plaquinhas e certificado.', 'Com as fotos, o nome e a cor favorita {do}.'],
    value: 9,
    personalized: true,
    imageKey: 'bonusAniversario',
    emoji: '🎂',
  },
  {
    id: 'quemcuida',
    doc: 'quemcuida',
    title: 'Kit Quem Cuida {do}',
    lines: ['Ficha de rotina pra pet sitter, avós, creche ou hotel.', 'Comida, passeios, remédios, manias e contatos.'],
    value: 7,
    personalized: true,
    imageKey: 'bonusQuemCuida',
    emoji: '📋',
  },
  {
    id: 'calendario',
    title: 'Calendário de Saúde por Idade',
    lines: ['O que fazer em cada fase da vida, de filhote a idoso.', 'Versões para cão e para gato.'],
    value: 9,
    personalized: false,
    imageKey: 'bonusCalendario',
    emoji: '🗓️',
  },
  {
    id: 'viagem',
    title: 'Guia: Como Viajar com seu Pet',
    lines: ['Carro, avião, ônibus e hotel: o que levar e o que exigir.', 'Checklist pronto pra imprimir.'],
    value: 7,
    personalized: false,
    imageKey: 'bonusViagem',
    emoji: '🧳',
  },
];

export const kitTotal = kitItems.reduce((s, i) => s + i.value, 0); // 67
export const fullTotal = kitTotal + bonusItems.reduce((s, i) => s + i.value, 0); // 99
