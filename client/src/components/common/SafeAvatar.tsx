import React, { useState, useEffect } from 'react';

interface SafeAvatarProps {
  src?: string | null;
  name?: string;
  initials?: string;
  className?: string;
  shape?: 'circle' | 'rounded';
}

export const SafeAvatar: React.FC<SafeAvatarProps> = ({
  src,
  name = 'User',
  initials: propInitials,
  className = 'w-10 h-10',
  shape = 'circle',
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || null);
    setImgLoaded(false);
    setImgError(false);
  }, [src]);

  const handleImageError = () => {
    if (currentSrc && currentSrc.startsWith('/uploads/') && !currentSrc.startsWith('http')) {
      // Automatic direct backend fallback if local proxy is bypassed
      setCurrentSrc(`http://localhost:5000${currentSrc}`);
    } else {
      setImgError(true);
    }
  };

  const fallbackInitials =
    propInitials ||
    (name
      ? name
          .trim()
          .split(/\s+/)
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'U');

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  // Deterministic clean background gradient based on name
  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-indigo-600 to-purple-700',
      'from-sky-600 to-blue-700',
      'from-teal-600 to-emerald-700',
      'from-blue-700 to-slate-800',
    ];
    return gradients[Math.abs(hash) % gradients.length];
  };

  const bgGradient = getGradient(name);

  return (
    <div
      className={`${className} ${shapeClass} relative shrink-0 overflow-hidden select-none flex items-center justify-center bg-gradient-to-br ${bgGradient} text-white font-black text-xs shadow-2xs border border-white/60`}
      title={name}
    >
      {/* Base Initials Layer - Always present, cannot overflow */}
      <span className="leading-none text-center tracking-tight text-white font-extrabold uppercase pointer-events-none">
        {fallbackInitials}
      </span>

      {/* Image Layer - Only visible once fully loaded successfully */}
      {currentSrc && !imgError && (
        <img
          src={currentSrc}
          alt=""
          onLoad={() => setImgLoaded(true)}
          onError={handleImageError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 pointer-events-none ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};
