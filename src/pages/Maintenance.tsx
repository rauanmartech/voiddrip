import React from 'react';
import capaMobile from '../assets/capa mobile.png';

const Maintenance = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden font-sans">
      <div className="relative w-full h-full">
        {/* Background Image - Cover for full immersion */}
        <img
          src={capaMobile}
          alt="Manutenção"
          className="w-full h-full object-cover opacity-80 object-[calc(50%+27px)_center] md:object-center"
        />

        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Bottom Content Area with Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end items-center pb-16 md:pb-24 px-8 text-center">
          <div className="max-w-2xl transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
            <p className="text-white/90 text-lg md:text-2xl font-light tracking-[0.1em] mb-4">
              Estamos preparando o melhor para você!
            </p>
            <h1 className="text-white text-3xl md:text-5xl font-bold uppercase tracking-[0.3em] drop-shadow-2xl animate-pulse">
              Em breve<span className="text-primary">...</span>
            </h1>

            {/* Minimalist divider */}
            <div className="w-12 h-[2px] bg-white/30 mx-auto mt-8 mb-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
