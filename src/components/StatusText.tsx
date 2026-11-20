import { CheckCircle2, Clock3, RotateCcw } from 'lucide-react';
import type { StatusCapaian } from '../types';

interface StatusTextProps {
  status: StatusCapaian;
  compact?: boolean;
}

export function StatusText({ status, compact = false }: StatusTextProps) {
  if (status === 'Tuntas / Lancar') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{compact ? 'Tuntas' : 'Tuntas / Lancar'}</span>
      </span>
    );
  }

  if (status === "Perlu Muraja'ah") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309] whitespace-nowrap">
        <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{compact ? "Muraja'ah" : "Perlu Muraja'ah"}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] whitespace-nowrap">
      <Clock3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{compact ? 'Proses' : 'Sedang Proses'}</span>
    </span>
  );
}
