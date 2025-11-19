"use client";

import { motion } from "framer-motion";

export const BrazilMap = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full max-w-[700px] max-h-[700px] opacity-80"
        fill="none"
      >
        <defs>
          <radialGradient id="raylsGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D9F94F" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#9D8CFC" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft radial glow */}
        <circle cx="60" cy="60" r="50" fill="url(#raylsGlow)" />

        {/* Concentric orbit lines */}
        <g stroke="#27272A" strokeWidth="0.4">
          <circle cx="60" cy="60" r="20" />
          <circle cx="60" cy="60" r="32" />
          <circle cx="60" cy="60" r="44" />
        </g>

        {/* Slowly rotating dashed orbit for subtle motion */}
        <motion.circle
          cx="60"
          cy="60"
          r="38"
          stroke="#3F3F46"
          strokeWidth="0.5"
          strokeDasharray="4 6"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ originX: "60px", originY: "60px" }}
        />

        {/* Central protocol node */}
        <circle cx="60" cy="60" r="3.2" fill="#D9F94F" />
        <motion.circle
          cx="60"
          cy="60"
          r="7"
          stroke="#D9F94F"
          strokeWidth="0.4"
          fill="none"
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Peripheral nodes (vaults / regions) */}
        {[
          { cx: 90, cy: 40 },
          { cx: 82, cy: 78 },
          { cx: 32, cy: 82 },
          { cx: 30, cy: 38 },
        ].map((p, idx) => (
          <g key={idx}>
            <line
              x1="60"
              y1="60"
              x2={p.cx}
              y2={p.cy}
              stroke="#27272A"
              strokeWidth="0.4"
            />
            <motion.circle
              cx={p.cx}
              cy={p.cy}
              r="1.8"
              fill="#D9F94F"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 3 + idx,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </g>
        ))}
      </svg>

      {/* Very light grid overlay for \"terminal\" feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:26px_26px] pointer-events-none" />
    </div>
  );
};

