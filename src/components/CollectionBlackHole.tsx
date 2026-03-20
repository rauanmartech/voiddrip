import { motion } from "framer-motion";

const CollectionBlackHole = () => {
  return (
    <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 flex items-center justify-center">
      {/* Gravitational Lensing / Outer Glow */}
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.15, 0.25, 0.15] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-white/5 blur-3xl"
      />

      {/* Accretion Disk - Outer Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border border-white/5 rounded-full"
      />

      {/* Accretion Disk - Middle Ring (Dashed) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[15%] border border-dashed border-white/10 rounded-full"
      />

      {/* Inner Distortion Ring */}
      <motion.div
        animate={{ 
          scale: [0.95, 1, 0.95],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-[30%] border-[0.5px] border-white/20 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]"
      />

      {/* The Singularity (Event Horizon) */}
      <div className="absolute inset-[35%] bg-black rounded-full shadow-[inset_0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden">
        {/* Subtle radial distortion inside */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-white/[0.02] to-transparent opacity-50" />
      </div>

      {/* Decorative Geometry */}
      <div className="absolute w-full h-[0.5px] bg-white/5 top-1/2 -translate-y-1/2 scale-x-125 opacity-20" />
      <div className="absolute h-full w-[0.5px] bg-white/5 left-1/2 -translate-x-1/2 scale-y-125 opacity-20" />
    </div>
  );
};

export default CollectionBlackHole;
