"use client";

import { motion } from "framer-motion";

export const BrazilMap = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full max-w-[600px] max-h-[600px] opacity-80"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        {/* Simplified Brazil Shape - Very Abstract */}
        <path
          d="M30,10 L50,5 L70,10 L80,20 L85,40 L70,60 L60,80 L40,90 L25,70 L15,40 L20,20 Z"
          className="text-rayls-charcoal fill-rayls-dark/50"
          stroke="currentColor"
        />
        
        {/* Mato Grosso (Center-West) */}
        <motion.circle
          cx="35"
          cy="40"
          r="1.5"
          className="fill-rayls-lime"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <circle cx="35" cy="40" r="0.5" className="fill-white" />

        {/* Paraná (South) */}
        <motion.circle
          cx="45"
          cy="65"
          r="1.5"
          className="fill-rayls-lime"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.5, 1],
            transition: { delay: 1 }
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <circle cx="45" cy="65" r="0.5" className="fill-white" />
      </svg>
      
      {/* Abstract Grid Overlay for "Tech" feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
    </div>
  );
};

