import React, { useState } from 'react';

export const JRU_OFFICIAL_LOGO_URL =
  'https://thumb.wikimedia.org/wikipedia/en/thumb/2/2f/Jose_Rizal_University_seal.svg/1280px-Jose_Rizal_University_seal.svg.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail';

export const JruLogo = ({
  size = 'md',
  className = '',
  showSubtitle = false,
  withText = false,
  align = 'center',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const currentSizeClass = className || sizeClasses[size];

  const sealGraphic = (
    <div
      className={`relative rounded-full shrink-0 flex items-center justify-center p-0.5 bg-white shadow-md border-2 border-yellow-400 group transition-transform duration-200 hover:scale-105 ${currentSizeClass}`}
      style={{ aspectRatio: '1 / 1' }}
    >
      {!imgError ? (
        <img
          src={JRU_OFFICIAL_LOGO_URL}
          alt="Jose Rizal University Official Seal"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-full"
          onError={() => setImgError(true)}
          loading="eager"
        />
      ) : (
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full rounded-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="60" cy="60" r="58" fill="#002147" stroke="#FBBF24" strokeWidth="4" />
          <circle cx="60" cy="60" r="51" fill="#FFFFFF" stroke="#002147" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="46" fill="#002147" />
          <circle cx="60" cy="60" r="32" fill="#FBBF24" />
          <circle cx="60" cy="60" r="30" fill="#001733" />
          <path
            d="M50 42 C54 39 64 40 66 45 C68 49 67 52 64 54 C66 57 65 61 62 63 C58 65 52 65 48 62 C46 58 48 50 50 42 Z"
            fill="#FBBF24"
          />
          <path
            d="M48 64 L66 64 C64 68 58 71 52 71 C48 71 47 67 48 64 Z"
            fill="#FFFFFF"
          />
          <path
            d="M46 75 C52 73 57 74 60 76 C63 74 68 73 74 75 L74 81 C68 79 63 80 60 82 C57 80 52 79 46 81 Z"
            fill="#FFFFFF"
          />
        </svg>
      )}
    </div>
  );

  if (!withText && !showSubtitle) {
    return sealGraphic;
  }

  return (
    <div
      id="jru-logo-header"
      className={`flex ${
        align === 'center'
          ? 'flex-col items-center text-center'
          : 'flex-row items-center gap-3 text-left'
      }`}
    >
      {sealGraphic}
      <div className={align === 'center' ? 'mt-2.5 space-y-0.5' : 'space-y-0.5'}>
        <div className="flex items-center gap-1.5">
          <h1 className="text-lg sm:text-xl font-black tracking-wide text-white uppercase font-varsity">
            Jose Rizal University
          </h1>
        </div>
        {showSubtitle && (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-yellow-300">
              Rizalian ReviewerHub
            </span>
            <p className="text-xs font-medium text-slate-300 tracking-wide">
              Community Learning &amp; Reviewer Sharing
            </p>
          </div>
        )}
      </div>
    </div>
  );
};