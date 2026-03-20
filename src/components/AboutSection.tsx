import { useMemo } from "react";

const DisintegratingText = ({ text }: { text: string }) => {
  const chars = useMemo(() => {
    return text.split("").map((char) => ({
      char,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      r: (Math.random() - 0.5) * 120,
      d: Math.random() * 0.4,
    }));
  }, [text]);

  return (
    <>
      {chars.map((item, index) => (
        <span
          key={index}
          className="disintegrate-char inline-block"
          style={
            {
              "--x": `${item.x}px`,
              "--y": `${item.y}px`,
              "--r": `${item.r}deg`,
              "--d": `${item.d}s`,
            } as React.CSSProperties
          }
        >
          {item.char === " " ? "\u00A0" : item.char}
        </span>
      ))}
    </>
  );
};

const AboutSection = () => {
  return (
    <section id="sobre" className="relative py-32 md:py-48 bg-background overflow-hidden border-t border-white/5">
      {/* Background Grid Distortions */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute inset-0 spacetime-grid opacity-30" />
        
        {/* Radial Distortion Shapes */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-40" viewBox="0 0 1000 1000">
          <circle cx="500" cy="500" r="300" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1 10" className="animate-[spin-slow_60s_linear_infinite]" />
          <circle cx="500" cy="500" r="400" fill="none" stroke="white" strokeWidth="0.2" className="opacity-50" />
          <circle cx="500" cy="500" r="450" fill="none" stroke="white" strokeWidth="0.1" className="opacity-30" />
          
          {/* Gravitational Lensing lines */}
          <path d="M 0,500 Q 500,200 1000,500" fill="none" stroke="white" strokeWidth="0.5" className="opacity-20" />
          <path d="M 0,500 Q 500,800 1000,500" fill="none" stroke="white" strokeWidth="0.5" className="opacity-20" />
          <path d="M 500,0 Q 200,500 500,1000" fill="none" stroke="white" strokeWidth="0.5" className="opacity-20" />
          <path d="M 500,0 Q 800,500 500,1000" fill="none" stroke="white" strokeWidth="0.5" className="opacity-20" />
        </svg>

        {/* Cinematic Faint Cosmic Dust (CSS Radial Gradients) */}
        <div className="absolute top-[20%] left-[10%] w-1 h-1 bg-white rounded-full blur-[1px] animate-pulse" />
        <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 bg-white/60 rounded-full blur-[2px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[70%] w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 md:gap-32 items-start">
          
          {/* Left Column: Cinematic Title & Geometry */}
          <div className="w-full lg:w-1/2 flex flex-col items-start pt-4">
            <div className="space-y-6 group cursor-default">
              <div className="inline-block px-3 py-1 border border-white/10 bg-white/[0.02] mb-4">
                <span className="font-display text-[9px] tracking-[0.4em] text-muted-foreground uppercase">
                  MANIFESTO .001
                </span>
              </div>
              
              <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tighter text-foreground group">
                <div className="overflow-hidden">
                  <div className="animate-fade-up">
                    <DisintegratingText text="O VAZIO" />
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
                    <span className="text-transparent stroke-white" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.7)" }}>
                      <DisintegratingText text="NÃO É" />
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
                    <DisintegratingText text="VAZIO" />
                  </div>
                </div>
              </h2>

              <p className="font-display text-xs md:text-sm tracking-[0.6em] text-muted-foreground mt-8 opacity-60">
                VOID DRIP SOCIETY
              </p>
            </div>

            {/* Brutalist Composition */}
            <div className="mt-20 relative w-full h-40 hidden md:block">
              <div className="absolute left-0 top-0 w-32 h-32 border border-white/10 flex items-center justify-center p-4">
                <div className="w-full h-full border border-white/20 animate-spin-slow" />
                <div className="absolute w-2 h-2 bg-white shadow-[0_0_15px_white]" />
              </div>
              <div className="absolute left-40 top-10 w-20 h-px bg-white/20" />
              <div className="absolute left-64 top-0 space-y-2">
                <div className="w-12 h-1 bg-white/10" />
                <div className="w-24 h-1 bg-white/5" />
                <div className="w-16 h-1 bg-white/20" />
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Philosophy */}
          <div className="w-full lg:w-1/2 flex flex-col space-y-12">
            <div className="space-y-8 max-w-xl">
              <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <p className="font-body text-base md:text-lg text-foreground/80 leading-relaxed tracking-wide">
                  Void Drip Society é um conceito de streetwear nascido do cruzamento entre a <span className="text-white font-medium">cultura urbana</span> e a <span className="text-white font-medium">filosofia cósmica</span>. 
                </p>
                <p className="font-body text-base md:text-lg text-muted-foreground leading-relaxed">
                  Aqui, o vazio não representa a ausência, mas a possibilidade infinita, a identidade em constante fluxo e o movimento que transcende a moda convencional.
                </p>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />

              <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <p className="font-body text-base md:text-lg text-muted-foreground leading-relaxed">
                  Nascida nas sombras do underground, a Void posiciona-se no espaço liminar entre o estilo de rua, o design futurista e a expressão subcultural.
                </p>
                <p className="font-body text-base md:text-lg text-foreground/80 leading-relaxed italic border-l-2 border-white/20 pl-6 py-2">
                  "Não somos apenas uma marca de roupas; somos um coletivo que orbita o centro gravitacional da autenticidade e da individualidade."
                </p>
              </div>
            </div>

            {/* Portal Element (Brutalist Box) */}
            <div className="relative group p-10 md:p-14 border border-white/10 bg-white/[0.01] transition-all duration-700 hover:border-white/30 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
              </div>
              
              <p className="font-body text-sm md:text-base text-muted-foreground leading-relaxed relative z-10">
                Nossa estética é moldada pela geometria do cosmos e pela brutalidade do concreto. Cada peça é um fragmento de um universo em expansão, onde a gravidade do estilo atrai aqueles que buscam algo além da superfície.
              </p>
              
              <div className="mt-8 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
                  <div className="w-1/2 h-full bg-white/10" />
                </div>
                <span className="font-display text-[10px] tracking-[0.3em] text-foreground">
                  SNC 2026 . VOID
                </span>
              </div>
              
              {/* Decorative corners */}
              <div className="absolute top-[-1px] left-[-1px] w-4 h-4 border-t border-l border-white/40" />
              <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 border-b border-r border-white/40" />
            </div>

            <div className="pt-8 flex flex-wrap gap-4 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
               <span className="font-display text-[9px] tracking-[0.2em] border border-white/20 px-2 py-1">GRAVIDADE</span>
               <span className="font-display text-[9px] tracking-[0.2em] border border-white/20 px-2 py-1">GEOMETRIA</span>
               <span className="font-display text-[9px] tracking-[0.2em] border border-white/20 px-2 py-1">FILOSOFIA</span>
               <div className="flex-grow h-px bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
