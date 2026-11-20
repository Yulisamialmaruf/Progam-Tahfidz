import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'rounded';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'circle',
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .replace(/^(Ustadz|Ustadzah|H\.|Hj\.|Bpk\.|Ibu)\s+/gi, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'AM';

  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={`Foto profil ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${SIZE_CLASSES[size]} ${radiusClass} object-cover border border-[#E5E7EB] bg-[#F3F6F4] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={`Inisial ${name}`}
      className={`${SIZE_CLASSES[size]} ${radiusClass} bg-[#14532D]/10 text-[#14532D] border border-[#14532D]/20 font-semibold flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
