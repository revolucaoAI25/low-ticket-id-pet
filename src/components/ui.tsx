import Image from 'next/image';
import { brand } from '@/config/brand';

export function Logo({ className = '', size = 120, priority = false }: { className?: string; size?: number; priority?: boolean }) {
  return (
    <Image
      src={brand.logo}
      alt={brand.name}
      width={size}
      height={Math.round(size * (1023 / 1118))}
      priority={priority}
      className={className}
      style={{ width: size, height: 'auto' }}
    />
  );
}

export function Stars({ value = 5, size = 18, className = '' }: { value?: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${value} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#F5A524" />
                <stop offset={`${fill * 100}%`} stopColor="#EADBC8" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${Math.round(fill * 100)})`}
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatInt(v: number): string {
  return v.toLocaleString('pt-BR');
}

/** Espaço reservado com o tamanho certo e a etiqueta do que vai ali. */
export function Slot({ label, className = '', ratio = '4 / 5' }: { label: string; className?: string; ratio?: string }) {
  return (
    <div className={`placeholder-slot ${className}`} style={{ aspectRatio: ratio }}>
      <span>
        📷
        <br />
        {label}
      </span>
    </div>
  );
}
