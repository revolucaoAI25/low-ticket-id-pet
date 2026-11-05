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
    lines: ['Frente e verso com foto, nome, raça, personalidade e tutores.', 'Campos para o nº do microchip e do RG Animal. 5 cores.'],
    value: 27,
  },
  {
    id: 'certidao',
    doc: 'certidao',
    short: 'Certidão',
    title: 'Certidão de {certidao}',
    lines: ['A história {do} num documento lindo pra emoldurar.', 'Foto, data, cidade e o nome dos tutores.'],
    value: 24,
  },
  {
    id: 'passaporte',
    doc: 'passaporte',
    short: 'Passaporte',
    title: 'Passaporte de Aventuras',
    lines: ['Livreto pra "carimbar" passeios e primeiras vezes.', 'O primeiro carimbo já vem com o lugar favorito {do}.'],
    value: 29,
  },
  {
    id: 'tag',
    doc: 'tag',
    short: 'Tag QR Code',
    title: 'Tag com QR Code + Página do Pet',
    lines: ['Quem encontrar {nome} escaneia e fala com você na hora.', 'Página com contatos, botão de WhatsApp e Modo Perdido.'],
    value: 37,
  },
  {
    id: 'vacina',
    doc: 'vacina',
    short: 'Vacinação',
    title: 'Carteira de Vacinação',
    lines: ['Vacinas, vermífugo e antipulgas organizados, com foto.', 'Lista de vacinas certa pra cada espécie.'],
    value: 19,
  },
  {
    id: 'torcedor',
    doc: 'torcedor',
    short: 'Torcedor',
    title: 'Carteirinha de Torcedor Pet',
    lines: ['"Torcedor oficial — Fã nº 1" com o escudo do time.', 'A carteirinha mais divertida da família.'],
    value: 17,
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
    lines: ['Convite, topo de bolo, plaquinhas e certificado.', 'Tudo com a foto e o nome {do}.'],
    value: 29,
    personalized: true,
    imageKey: 'bonusAniversario',
    emoji: '🎂',
  },
  {
    id: 'quemcuida',
    doc: 'quemcuida',
    title: 'Kit Quem Cuida {do}',
    lines: ['Ficha de rotina pra pet sitter, avós, creche ou hotel.', 'Comida, passeios, remédios, manias e contatos.'],
    value: 19,
    personalized: true,
    imageKey: 'bonusQuemCuida',
    emoji: '📋',
  },
  {
    id: 'calendario',
    title: 'Calendário de Saúde por Idade',
    lines: ['O que fazer em cada fase da vida, de filhote a idoso.', 'Versões para cão e para gato.'],
    value: 27,
    personalized: false,
    imageKey: 'bonusCalendario',
    emoji: '🗓️',
  },
  {
    id: 'viagem',
    title: 'Guia: Como Viajar com seu Pet',
    lines: ['Carro, avião, ônibus e hotel: o que levar e o que exigir.', 'Checklist pronto pra imprimir.'],
    value: 24,
    personalized: false,
    imageKey: 'bonusViagem',
    emoji: '🧳',
  },
];

export const kitTotal = kitItems.reduce((s, i) => s + i.value, 0); // 153
export const fullTotal = kitTotal + bonusItems.reduce((s, i) => s + i.value, 0); // 252
