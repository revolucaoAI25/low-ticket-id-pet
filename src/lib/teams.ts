import type { ExtraTeam } from '@/config/site';

export interface Team {
  id: string;
  name: string;
  /** Nome curto que vai na carteirinha. */
  short: string;
  /** Apelidos e variações para a busca. */
  aliases: string[];
  primary: string;
  secondary: string;
  crest: string | null;
  /** Aparece na grade inicial (os mais buscados). */
  popular?: boolean;
}

const t = (
  id: string,
  short: string,
  name: string,
  primary: string,
  secondary: string,
  aliases: string,
  popular = false,
): Team => ({ id, short, name, primary, secondary, aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean), crest: `/teams/${id}.png`, popular });

export const TEAMS: Team[] = [
  t('flamengo', 'Flamengo', 'Clube de Regatas do Flamengo', '#C4161C', '#111111', 'mengão, mengo, fla, crf, urubu, rubro-negro carioca', true),
  t('corinthians', 'Corinthians', 'Sport Club Corinthians Paulista', '#111111', '#FFFFFF', 'timão, timao, coringão, sccp, curintia, corintians, corinthias', true),
  t('palmeiras', 'Palmeiras', 'Sociedade Esportiva Palmeiras', '#006437', '#FFFFFF', 'verdão, verdao, porco, palestra, sep, parmera', true),
  t('sao-paulo', 'São Paulo', 'São Paulo Futebol Clube', '#E30613', '#111111', 'spfc, tricolor paulista, soberano, sampa', true),
  t('vasco', 'Vasco', 'Club de Regatas Vasco da Gama', '#111111', '#FFFFFF', 'vascão, vascao, gigante da colina, cruzmaltino, vasco da gama', true),
  t('gremio', 'Grêmio', 'Grêmio Foot-Ball Porto Alegrense', '#0D80BF', '#111111', 'gremio, tricolor gaucho, imortal, gremista', true),
  t('internacional', 'Internacional', 'Sport Club Internacional', '#E5050F', '#FFFFFF', 'inter, colorado, sci, inter de porto alegre', true),
  t('cruzeiro', 'Cruzeiro', 'Cruzeiro Esporte Clube', '#2F529E', '#FFFFFF', 'raposa, cabuloso, cec, celeste', true),
  t('atletico-mg', 'Atlético-MG', 'Clube Atlético Mineiro', '#111111', '#FFFFFF', 'galo, atletico mineiro, cam, galão da massa, atletico mg', true),
  t('santos', 'Santos', 'Santos Futebol Clube', '#111111', '#FFFFFF', 'peixe, sfc, peixão, alvinegro praiano', true),
  t('fluminense', 'Fluminense', 'Fluminense Football Club', '#870A28', '#00613C', 'flu, fluzão, tricolor carioca, ffc, nense', true),
  t('botafogo', 'Botafogo', 'Botafogo de Futebol e Regatas', '#111111', '#FFFFFF', 'fogão, fogao, glorioso, bfr, estrela solitária', true),
  t('bahia', 'Bahia', 'Esporte Clube Bahia', '#006CB5', '#ED3237', 'bahêa, baea, esquadrão, tricolor de aço, ecb'),
  t('fortaleza', 'Fortaleza', 'Fortaleza Esporte Clube', '#11519B', '#E30613', 'leão do pici, laion, tricolor do pici, fec'),
  t('sport', 'Sport', 'Sport Club do Recife', '#D4001F', '#111111', 'sport recife, leão da ilha do retiro, leão, scr'),
  t('ceara', 'Ceará', 'Ceará Sporting Club', '#111111', '#FFFFFF', 'ceara, vozão, vovô, vozao'),
  t('vitoria', 'Vitória', 'Esporte Clube Vitória', '#E30613', '#111111', 'vitoria, leão da barra, ecv, rubro-negro baiano'),
  t('athletico-pr', 'Athletico-PR', 'Club Athletico Paranaense', '#C8102E', '#111111', 'atletico paranaense, athletico, furacão, cap, atletico pr'),
  t('coritiba', 'Coritiba', 'Coritiba Foot Ball Club', '#00544D', '#FFFFFF', 'coxa, coxa-branca, cfc'),
  t('goias', 'Goiás', 'Goiás Esporte Clube', '#006B3F', '#FFFFFF', 'goias, esmeraldino, verdão goiano'),
  t('atletico-go', 'Atlético-GO', 'Atlético Clube Goianiense', '#E30613', '#111111', 'atletico goianiense, dragão, acg, atletico go'),
  t('juventude', 'Juventude', 'Esporte Clube Juventude', '#009B3A', '#FFFFFF', 'ju, papo, jaconero'),
  t('bragantino', 'Bragantino', 'Red Bull Bragantino', '#E30613', '#FFFFFF', 'red bull, massa bruta, rb bragantino, braga'),
  t('cuiaba', 'Cuiabá', 'Cuiabá Esporte Clube', '#00843D', '#FFD100', 'cuiaba, dourado, auriverde'),
  t('america-mg', 'América-MG', 'América Futebol Clube', '#00843D', '#111111', 'america mineiro, coelho, america mg, coelhão'),
  t('remo', 'Remo', 'Clube do Remo', '#0A1F44', '#FFFFFF', 'leão azul, clube do remo, filho da glória'),
  t('paysandu', 'Paysandu', 'Paysandu Sport Club', '#0072CE', '#FFFFFF', 'papão, papão da curuzu, paysandú, paissandu'),
  t('nautico', 'Náutico', 'Clube Náutico Capibaribe', '#E30613', '#FFFFFF', 'nautico, timbu, alvirrubro'),
  t('santa-cruz', 'Santa Cruz', 'Santa Cruz Futebol Clube', '#E30613', '#111111', 'cobra coral, santinha, tricolor do arruda'),
  t('ponte-preta', 'Ponte Preta', 'Associação Atlética Ponte Preta', '#111111', '#FFFFFF', 'macaca, ponte, aapp'),
  t('guarani', 'Guarani', 'Guarani Futebol Clube', '#00843D', '#FFFFFF', 'bugre, guarani campinas'),
  t('chapecoense', 'Chapecoense', 'Associação Chapecoense de Futebol', '#00843D', '#FFFFFF', 'chape, verdão do oeste, furacão do oeste'),
  t('avai', 'Avaí', 'Avaí Futebol Clube', '#0057A8', '#FFFFFF', 'avai, leão da ilha, leão'),
  t('figueirense', 'Figueirense', 'Figueirense Futebol Clube', '#111111', '#FFFFFF', 'figueira, furacão do estreito, figueirão'),
  t('criciuma', 'Criciúma', 'Criciúma Esporte Clube', '#F2C200', '#111111', 'criciuma, tigre, tigrão'),
  t('crb', 'CRB', 'Clube de Regatas Brasil', '#E30613', '#FFFFFF', 'galo da praia, galo de campina, regatas brasil'),
  t('csa', 'CSA', 'Centro Sportivo Alagoano', '#0057A8', '#FFFFFF', 'azulão, azulao do mutange, centro sportivo alagoano'),
  t('mirassol', 'Mirassol', 'Mirassol Futebol Clube', '#F2C200', '#00843D', 'leão, leão caipira, mirassol fc'),
  t('portuguesa', 'Portuguesa', 'Associação Portuguesa de Desportos', '#E30613', '#00843D', 'lusa, portuguesa de desportos, lusinha'),
  t('novorizontino', 'Novorizontino', 'Grêmio Novorizontino', '#F2C200', '#111111', 'tigre do vale, novori, gremio novorizontino'),
];

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lista final = times padrão + times cadastrados no painel (o painel pode sobrescrever um padrão pelo id). */
export function allTeams(extra: ExtraTeam[] = []): Team[] {
  const map = new Map<string, Team>(TEAMS.map((x) => [x.id, x]));
  for (const e of extra) {
    if (!e?.id || !e.name) continue;
    const base = map.get(e.id);
    map.set(e.id, {
      id: e.id,
      name: e.name,
      short: e.name,
      aliases: [...(base?.aliases ?? []), ...(e.aliases ?? '').split(',').map((a) => a.trim()).filter(Boolean)],
      primary: e.primary || base?.primary || '#6F2A7A',
      secondary: e.secondary || base?.secondary || '#FFFFFF',
      crest: e.crest || base?.crest || null,
      popular: base?.popular,
    });
  }
  return Array.from(map.values());
}

/** Busca por nome, nome completo e apelidos, ignorando acento e maiúsculas. */
export function searchTeams(q: string, teams: Team[]): Team[] {
  const n = normalize(q);
  if (!n) return teams;
  const scored: { team: Team; score: number }[] = [];
  for (const team of teams) {
    const fields = [team.short, team.name, ...team.aliases].map(normalize);
    let score = 0;
    for (const f of fields) {
      if (f === n) score = Math.max(score, 100);
      else if (f.startsWith(n)) score = Math.max(score, 60);
      else if (f.split(' ').some((w) => w.startsWith(n))) score = Math.max(score, 40);
      else if (n.length >= 3 && f.includes(n)) score = Math.max(score, 20);
    }
    if (score) scored.push({ team, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.team);
}

export function findTeam(id: string | null | undefined, teams: Team[]): Team | undefined {
  if (!id) return undefined;
  return teams.find((x) => x.id === id);
}
