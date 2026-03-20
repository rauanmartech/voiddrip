import heroBg from "@/assets/hero-bg.png";
import { useMemo } from "react";
import AdminSidebar from "./AdminSidebar";
import { Link } from "react-router-dom";

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

const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AdminSidebar />
      <img
        src={heroBg}
        alt="Void Drip Society — streetwear urbano com céu cósmico"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="hero-gradient-overlay absolute inset-0" />

      {/* Cosmic ring decorations */}
      <div className="cosmic-ring w-[600px] h-[600px] top-[10%] left-1/2 -translate-x-1/2 animate-spin-slow opacity-20" />
      <div className="cosmic-ring w-[400px] h-[400px] top-[15%] left-1/2 -translate-x-1/2 animate-spin-slow opacity-10" style={{ animationDirection: "reverse", animationDuration: "20s" }} />

      <div className="relative z-10 flex flex-col items-center justify-between h-full text-center px-6 pt-24 md:pt-12 pb-4 md:pb-6">
        <div className="flex flex-col items-center group cursor-default relative">
          {/* Subtle gradient for readability */}
          <div className="absolute inset-x-[-20%] inset-y-[-20%] bg-black/50 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="font-display text-7xl md:text-9xl font-bold tracking-[0.2em] text-foreground animate-fade-up">
              <DisintegratingText text="VOID" />
            </h1>
            <p className="font-display text-lg md:text-2xl tracking-[0.5em] text-muted-foreground mt-2 animate-fade-up-delay">
              <DisintegratingText text="DRIP SOCIETY" />
            </p>
          </div>
        </div>
        <Link to="/colecao" className="btn-explore mb-2 md:mb-4 animate-fade-up-delay-2">
          Explorar Conjuntos
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
