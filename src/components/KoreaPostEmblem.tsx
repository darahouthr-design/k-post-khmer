import React from 'react';

interface KoreaPostEmblemProps {
  className?: string;
}

export const KoreaPostEmblem: React.FC<KoreaPostEmblemProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <img
      src="/logo.svg"
      alt="Korea Post Address Standardization System Logo"
      className={`${className} object-contain select-none shrink-0`}
    />
  );
};
