import { useState } from "react";
import { ChevronDown, Check, Filter, ListFilter } from "lucide-react";

interface GridControlsProps {
  showUnavailable: boolean;
  setShowUnavailable: (val: boolean) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

const sortOptions = [
  { id: "popular", label: "Mais Populares" },
  { id: "newest", label: "Mais Recentes" },
  { id: "name", label: "Nome (A-Z)" },
  { id: "type", label: "Tipo / Categoria" },
  { id: "price-asc", label: "Menor Preço" },
  { id: "price-desc", label: "Maior Preço" },
];

const GridControls = ({ showUnavailable, setShowUnavailable, sortBy, setSortBy }: GridControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentSortLabel = sortOptions.find(opt => opt.id === sortBy)?.label || "Ordenar por";

  return (
    <div className="container mx-auto px-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <button
          onClick={() => setShowUnavailable(!showUnavailable)}
          className="flex items-center gap-3 group transition-all"
        >
          <div className={`w-5 h-5 border rounded-sm flex items-center justify-center transition-colors ${showUnavailable ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'}`}>
            {showUnavailable && <Check size={14} className="text-primary-foreground" />}
          </div>
          <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase transition-colors">
            Mostrar Indisponíveis
          </span>
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-4 px-6 py-2.5 bg-card/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all min-w-[200px] justify-between group"
        >
          <div className="flex items-center gap-3">
            <ListFilter size={14} className="text-primary" />
            <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground uppercase pt-0.5">
              {currentSortLabel}
            </span>
          </div>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-full min-w-[200px] bg-card/95 backdrop-blur-xl border border-white/5 shadow-2xl z-50 animate-fade-in py-2 overflow-hidden">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSortBy(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-6 py-3 font-display text-[9px] tracking-[0.2em] uppercase transition-all flex items-center justify-between group ${
                    sortBy === option.id ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {option.label}
                  {sortBy === option.id && <Check size={10} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GridControls;
