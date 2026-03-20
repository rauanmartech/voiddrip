import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Collection = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center relative overflow-hidden pt-24">
        {/* Spacetime grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Cosmic ring decorations */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
          style={{ width: 600, height: 600, animation: "spin-slow 60s linear infinite" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.04] pointer-events-none"
          style={{ width: 400, height: 400, animation: "spin-slow 40s linear infinite reverse" }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.015] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-6 flex flex-col items-center gap-8">
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="h-px w-10 bg-white/20" />
            <span className="font-display text-[9px] tracking-[0.5em] text-muted-foreground uppercase">
              Em desenvolvimento
            </span>
            <div className="h-px w-10 bg-white/20" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl tracking-[-0.02em] text-foreground leading-tight"
          >
            CONJUNTOS
            <br />
            <span className="text-muted-foreground/25">EM BREVE</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-[10px] md:text-xs tracking-[0.4em] text-muted-foreground uppercase max-w-xs leading-loose"
          >
            Looks completos selecionados pelo nosso time. Novidade chegando em breve.
          </motion.p>

          {/* Pulsing dot indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 mt-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: "0.3s" }} />
            <span className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: "0.6s" }} />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Collection;
