import React from "react";
import { motion } from "framer-motion";

export const PharmacyStorefrontIllustration = ({ className = "" }) => {
  return (
    <div className={`relative flex w-full flex-col items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Ambient background glow behind the cross and roof */}
      <div className="absolute -top-10 size-48 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute top-8 size-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Storefront SVG */}
      <svg
        viewBox="0 0 680 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[620px] h-auto drop-shadow-md"
      >
        <defs>
          <linearGradient id="roofGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--app-color-surface-alt, #1e293b)" />
            <stop offset="100%" stopColor="var(--app-color-surface, #0f172a)" />
          </linearGradient>

          <linearGradient id="glassLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="neonCrossGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>

          <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Ground Horizon Line with Subtle Wave ──────── */}
        <path
          d="M0 165 C 170 155, 510 175, 680 165"
          stroke="url(#roofGlow)"
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />

        {/* ── Building Structure ──────── */}
        {/* Main Storefront Body */}
        <rect
          x="200"
          y="65"
          width="280"
          height="100"
          rx="6"
          fill="url(#wallGrad)"
          stroke="var(--app-color-border, #334155)"
          strokeWidth="1.5"
        />

        {/* Lower Base Step */}
        <rect
          x="180"
          y="162"
          width="320"
          height="5"
          rx="2.5"
          fill="var(--app-color-border-strong, #475569)"
        />

        {/* Left Side Wing (Adjacent shops/building outline) */}
        <path
          d="M 120 165 L 120 100 L 200 100"
          stroke="var(--app-color-border, #334155)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.4"
        />
        {/* Right Side Wing */}
        <path
          d="M 480 100 L 560 100 L 560 165"
          stroke="var(--app-color-border, #334155)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.4"
        />

        {/* Architectural Cornice / Top Fascia */}
        <rect
          x="195"
          y="56"
          width="290"
          height="12"
          rx="3"
          fill="var(--app-color-surface-hover, #334155)"
          stroke="var(--app-color-border-strong, #475569)"
          strokeWidth="1"
        />

        {/* ── Glowing Neon Pharmacy Cross ──────── */}
        {/* Ambient Back Glow of Cross */}
        <rect
          x="328"
          y="18"
          width="24"
          height="24"
          rx="4"
          fill="#10B981"
          opacity="0.4"
          filter="url(#neonBlur)"
        />
        {/* Central Cross Sign Mount */}
        <rect
          x="318"
          y="10"
          width="44"
          height="46"
          rx="8"
          fill="var(--app-color-surface, #0f172a)"
          stroke="var(--app-color-border, #334155)"
          strokeWidth="1.5"
        />
        {/* Vertical Cross Bar */}
        <rect
          x="334"
          y="17"
          width="12"
          height="32"
          rx="3"
          fill="url(#neonCrossGlow)"
          filter="url(#neonBlur)"
        />
        {/* Horizontal Cross Bar */}
        <rect
          x="324"
          y="27"
          width="32"
          height="12"
          rx="3"
          fill="url(#neonCrossGlow)"
          filter="url(#neonBlur)"
        />
        {/* Center crisp cross core */}
        <path
          d="M336 21 H344 V29 H352 V37 H344 V45 H336 V37 H328 V29 H336 Z"
          fill="#DCFCE7"
        />

        {/* ── Glass Windows & Automatic Entry Doors ──────── */}
        {/* Left Window */}
        <rect
          x="215"
          y="80"
          width="60"
          height="75"
          rx="4"
          fill="url(#glassLight)"
          stroke="var(--app-color-border, #334155)"
          strokeWidth="1"
        />
        {/* Left Window Shelves / Medicine Grid */}
        <line x1="218" y1="102" x2="272" y2="102" stroke="var(--app-color-border, #334155)" strokeWidth="0.8" opacity="0.6" />
        <line x1="218" y1="125" x2="272" y2="125" stroke="var(--app-color-border, #334155)" strokeWidth="0.8" opacity="0.6" />
        {/* Shelf Bottles */}
        <rect x="222" y="93" width="5" height="8" rx="1" fill="#10B981" opacity="0.7" />
        <rect x="231" y="94" width="7" height="7" rx="1" fill="#3B82F6" opacity="0.6" />
        <rect x="242" y="92" width="6" height="9" rx="1" fill="#A855F7" opacity="0.6" />
        <rect x="254" y="94" width="5" height="7" rx="1" fill="#F59E0B" opacity="0.6" />

        {/* Right Window */}
        <rect
          x="405"
          y="80"
          width="60"
          height="75"
          rx="4"
          fill="url(#glassLight)"
          stroke="var(--app-color-border, #334155)"
          strokeWidth="1"
        />
        {/* Right Window Shelves */}
        <line x1="408" y1="102" x2="462" y2="102" stroke="var(--app-color-border, #334155)" strokeWidth="0.8" opacity="0.6" />
        <line x1="408" y1="125" x2="462" y2="125" stroke="var(--app-color-border, #334155)" strokeWidth="0.8" opacity="0.6" />
        {/* Shelf Bottles */}
        <rect x="412" y="94" width="6" height="7" rx="1" fill="#F59E0B" opacity="0.6" />
        <rect x="422" y="92" width="7" height="9" rx="1" fill="#10B981" opacity="0.7" />
        <rect x="434" y="93" width="5" height="8" rx="1" fill="#3B82F6" opacity="0.6" />
        <rect x="444" y="94" width="6" height="7" rx="1" fill="#A855F7" opacity="0.6" />

        {/* Central Entrance Double Glass Doors */}
        <rect
          x="292"
          y="76"
          width="96"
          height="88"
          rx="3"
          fill="url(#glassLight)"
          stroke="var(--app-color-border-strong, #475569)"
          strokeWidth="1.2"
        />
        {/* Door Divider */}
        <line x1="340" y1="76" x2="340" y2="164" stroke="var(--app-color-border-strong, #475569)" strokeWidth="1.5" />
        {/* Door Handles */}
        <line x1="335" y1="112" x2="335" y2="132" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="345" y1="112" x2="345" y2="132" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

        {/* Subtle Foliage / Planter Pots next to entrance */}
        <path d="M190 164 Q193 150 197 142 Q202 154 205 164 Z" fill="#10B981" opacity="0.4" />
        <path d="M475 164 Q478 150 482 142 Q487 154 490 164 Z" fill="#10B981" opacity="0.4" />
      </svg>
    </div>
  );
};

export default PharmacyStorefrontIllustration;

