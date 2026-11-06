'use client';

import { ChevronDown, PawPrint, Search, Sofa, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { TeamChoice } from '@/lib/pet';
import { normalize, searchTeams, type Team } from '@/lib/teams';

interface Props {
  teams: Team[];
  value?: TeamChoice;
  onPick: (t: TeamChoice, unknown?: boolean) => void;
}

function Crest({ team, size = 44 }: { team: Team; size?: number }) {
  if (!team.crest)
    return (
      <span className="flex items-center justify-center rounded-full" style={{ width: size, height: size, background: team.primary, color: '#fff' }}>
        <PawPrint size={size * 0.5} />
      </span>
    );
  return <Image src={team.crest} alt="" width={size} height={size} className="object-contain" style={{ width: size, height: size }} />;
}

export function TeamPicker({ teams, value, onPick }: Props) {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchTeams(q, teams), [q, teams]);
  const popular = useMemo(() => teams.filter((t) => t.popular), [teams]);
  const others = useMemo(() => teams.filter((t) => !t.popular).sort((a, b) => a.short.localeCompare(b.short, 'pt-BR')), [teams]);
  const typed = q.trim();
  const noMatch = typed.length >= 2 && results.length === 0;

  const row = (t: Team) => (
    <button
      key={t.id}
      type="button"
      data-selected={value?.id === t.id}
      onClick={() => onPick({ id: t.id, name: t.short })}
      className="option !gap-3 !p-3"
    >
      <Crest team={t} size={36} />
      <span className="flex-1">{t.short}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cacau/40" size={20} />
        <input
          className="input !pl-12"
          placeholder="Busque seu time"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      {noMatch && (
        <div className="anim-fade-up rounded-2xl border-2 border-mel/60 bg-[#FFF6E5] p-4 text-[15px]">
          <p className="font-bold">Ainda não temos o escudo do “{typed}”</p>
          <p className="mt-1 text-cacau/80">
            Sem problema: a carteirinha sai com um escudo especial do Clube do Focinho e o nome do seu time. Depois da compra você pode trocar
            quando quiser.
          </p>
          <button type="button" className="btn-primary mt-3 w-full !min-h-[48px] !text-base" onClick={() => onPick({ id: null, name: typed }, true)}>
            Usar “{typed}” na carteirinha
          </button>
        </div>
      )}

      {typed ? (
        <div className="grid grid-cols-1 gap-2">{results.slice(0, 12).map(row)}</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2">
            {popular.map((t) => (
              <button
                key={t.id}
                type="button"
                data-selected={value?.id === t.id}
                onClick={() => onPick({ id: t.id, name: t.short })}
                className="option !flex-col !gap-1 !px-1 !py-3 text-center !text-[12px] leading-tight"
              >
                <Crest team={t} size={40} />
                <span className="line-clamp-1">{t.short}</span>
              </button>
            ))}
          </div>
          <details className="group rounded-2xl border-2 border-linha bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-bold">
              Ver todos os {teams.length} times
              <ChevronDown size={20} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid grid-cols-1 gap-2 p-3 pt-0">{others.map(row)}</div>
          </details>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="option justify-center !p-3 text-[15px]" data-selected={value?.none === true} onClick={() => onPick({ id: null, name: '', none: true })}>
          <Sofa size={18} className="text-roxo" /> Não torce
        </button>
        <button
          type="button"
          className="option justify-center !p-3 text-[15px]"
          onClick={() => {
            const el = document.querySelector<HTMLInputElement>('input[enterkeyhint="search"]');
            el?.focus();
          }}
        >
          <Trophy size={18} className="text-roxo" /> Outro time
        </button>
      </div>
    </div>
  );
}

export function matchTypedTeam(typed: string, teams: Team[]): Team | undefined {
  const n = normalize(typed);
  return teams.find((t) => [t.short, t.name, ...t.aliases].some((f) => normalize(f) === n));
}
