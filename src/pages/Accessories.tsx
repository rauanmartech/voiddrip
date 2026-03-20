import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import CosmicElements from "@/components/CosmicElements";
import { motion } from "framer-motion";

const Accessories = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative flex flex-col pt-20">
      <Navbar />
      
      <main className="flex-grow">
        {/* Cinematic Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-[#080808]">
            <div className="absolute inset-0 spacetime-grid opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          </div>

          <CosmicElements />
          
          {/* Hero background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-40">
             <svg className="w-full h-full" viewBox="0 0 1000 1000">
                <circle cx="500" cy="500" r="350" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1 10" className="animate-[spin-slow_80s_linear_infinite]" />
                <circle cx="500" cy="500" r="150" fill="none" stroke="white" strokeWidth="0.2" className="opacity-30" />
                <path d="M 0,500 Q 500,200 1000,500" fill="none" stroke="white" strokeWidth="0.5" className="opacity-10" />
                <path d="M 0,500 Q 500,800 1000,500" fill="none" stroke="white" strokeWidth="0.5" className="opacity-10" />
             </svg>
          </div>

          <div className="relative z-10 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-block px-3 py-1 border border-white/10 bg-white/[0.02] mb-6 shadow-[0_0_20px_rgba(255,255,255,0.03)]">
                <span className="font-display text-[9px] tracking-[0.4em] text-muted-foreground uppercase">
                  EQUIPAMENTO . VOID
                </span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-[-0.02em] text-foreground leading-tight">
                ACESSÓRIOS <br />
                <span className="text-transparent stroke-white" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.7)' }}>
                  DO VAZIO
                </span>
              </h1>
              <p className="font-display text-[10px] md:text-sm tracking-[0.6em] text-muted-foreground mt-8 opacity-60 uppercase">
                Curadoria Minimalista e Cósmica
              </p>
            </motion.div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30">
             <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
             <span className="font-display text-[8px] tracking-[0.3em] uppercase">SCROLL</span>
          </div>
        </section>

        {/* Product Grid Section */}
        <section className="relative py-24 md:py-32 bg-background">
          <div className="container mx-auto px-6 mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
              <div className="max-w-xl">
                <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] mb-4">CURADORIA</h2>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Objetos moldados pela geometria e pela gravidade. Cada acessório é um fragmento de identidade urbana projetado para o futuro.
                </p>
              </div>
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-8 h-[1px] bg-white" />
                <span className="font-display text-[10px] tracking-[0.3em]">ARTIFATOS .002</span>
              </div>
            </div>
          </div>

          {/* Filtering is locked to 'Acessórios' category */}
          <ProductGrid 
            activeCategory="Acessórios" 
            showOnlyAvailable={false} 
            sortBy="newest" 
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Accessories;
