import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useSets } from "@/hooks/useSets";
import { Layers, Plus, X, ArrowUpRight } from "lucide-react";
import ProductModal from "@/components/ProductModal";
import { Product } from "@/components/ProductGrid";
import CosmicElements from "@/components/CosmicElements";

const Collection = () => {
  const { data: sets, isLoading } = useSets();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSetForGrid, setSelectedSetForGrid] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col font-display uppercase selection:bg-primary selection:text-black">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20 relative overflow-hidden">
        {/* Spacetime grid background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 0% 100% / 0.03) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <CosmicElements />
        
        {/* Page Header */}
        <div className="container mx-auto px-6 mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-12 bg-primary/40" />
              <span className="text-[10px] tracking-[0.5em] text-primary">CURADORIA EXCLUSIVA</span>
            </div>
            <h1 className="text-4xl md:text-6xl tracking-[-0.02em] mb-6">
              CONJUNTOS <span className="text-muted-foreground/30 font-light">VOID</span>
            </h1>
            <p className="text-[10px] md:text-xs tracking-[0.3em] text-muted-foreground leading-relaxed max-w-md">
              LOOKS COMPLETOS SELECIONADOS PELO NOSSO TIME PARA ELEVAR SEU DRIP AO NÍVEL CÓSMICO.
            </p>
          </motion.div>
        </div>

        {/* Sets List */}
        <div className="container mx-auto px-6 space-y-32 relative z-10">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sets?.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground tracking-widest">NENHUM CONJUNTO ENCONTRADO</p>
            </div>
          ) : (
            sets?.map((set, setIdx) => (
              <motion.div 
                key={set.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: setIdx * 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* Left Side: Banner & Info */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                   <div className="relative group">
                      <div className="aspect-square overflow-hidden bg-secondary border border-white/5 relative">
                        {/* Redesigned Sold Out Overlay for Set */}
                        {set.set_items?.every((i: any) => i.products.stock_quantity <= 0) && (
                          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            <div className="w-[180%] bg-primary text-black py-3 -rotate-[15deg] border-y border-black/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex items-center">
                              <motion.div 
                                className="flex gap-12 items-center whitespace-nowrap"
                                animate={{ x: [0, -1000] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              >
                                {[...Array(10)].map((_, i) => (
                                  <div key={i} className="flex gap-12 items-center">
                                    <span className="text-[11px] font-bold tracking-[0.8em]">SOLD OUT</span>
                                    <div className="w-2 h-2 bg-black rotate-45" />
                                    <span className="text-[11px] font-bold tracking-[0.8em]">NULL STOCK</span>
                                    <div className="w-2 h-2 bg-black rotate-45" />
                                    <span className="text-[11px] font-bold tracking-[0.8em]">VOID_DEPLETED</span>
                                    <div className="w-2 h-2 bg-black rotate-45" />
                                  </div>
                                ))}
                              </motion.div>
                            </div>
                          </div>
                        )}

                        {set.banner_url ? (
                          <img 
                            src={set.banner_url} 
                            alt={set.name}
                            className="w-full h-full object-cover transition-all duration-1000 scale-105 group-hover:scale-100"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                             <Layers className="text-white/10" size={64} />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                        
                        <div className="absolute top-6 left-6">
                          <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-[8px] tracking-[0.3em] text-primary">
                            SET #{setIdx + 1}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-2xl md:text-3xl tracking-widest mb-4 group-hover:text-primary transition-colors">
                          {set.name}
                        </h2>
                        <p className="text-[10px] text-muted-foreground tracking-[0.2em] leading-relaxed italic">
                          "{set.description}"
                        </p>
                      </div>
                   </div>
                </div>

                {/* Right Side: Products Grid */}
                <div className="lg:col-span-7 xl:col-span-8">
                  <div className="grid grid-cols-1 gap-4">
                    {set.set_items?.slice(0, 3).map((item, itemIdx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 + itemIdx * 0.1 }}
                        className="group flex items-center gap-6 p-4 bg-card/10 backdrop-blur-md border border-white/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                        onClick={() => setSelectedProduct(item.products as any)}
                      >
                         <div className="w-24 h-24 sm:w-32 sm:h-32 bg-secondary flex-shrink-0 overflow-hidden border border-white/5 relative">
                            {item.products.stock_quantity <= 0 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                <span className="text-[7px] tracking-[0.2em] text-white/80 border border-white/20 px-2 py-1">ESGOTADO</span>
                              </div>
                            )}
                            <img 
                              src={item.products.image_url.split(',')[0]} 
                              alt={item.products.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                         </div>

                         <div className="flex-1">
                            <span className="text-[8px] tracking-[0.4em] text-primary/60 mb-1 block">
                              {item.products.category}
                            </span>
                            <h3 className="text-sm sm:text-base tracking-widest mb-2 group-hover:text-primary transition-colors">
                              {item.products.name}
                            </h3>
                            <p className="text-[10px] sm:text-xs tracking-widest text-muted-foreground">
                              {formatPrice(item.products.price)}
                            </p>
                         </div>

                         <div className="hidden sm:flex w-12 h-12 items-center justify-center border border-white/5 rounded-full group-hover:bg-primary group-hover:text-black transition-all">
                            <VoidViewIcon />
                         </div>

                         <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}

                    {set.set_items && set.set_items.length > 3 && (
                      <button 
                        className="w-full py-4 border border-dashed border-white/10 text-[10px] tracking-[0.4em] text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-3 group"
                        onClick={() => setSelectedSetForGrid(set)}
                      >
                        VER TODOS OS ITENS <Plus size={12} className="group-hover:rotate-90 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSetForGrid && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
              onClick={() => setSelectedSetForGrid(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl max-h-full bg-card border border-white/10 p-8 md:p-12 overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setSelectedSetForGrid(null)}
                className="absolute top-8 right-8 text-muted-foreground hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-12">
                <span className="text-[10px] tracking-[0.5em] text-primary block mb-2">FULL SET VIEW</span>
                <h2 className="text-3xl md:text-5xl tracking-widest">{selectedSetForGrid.name}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedSetForGrid.set_items?.map((item: any, idx: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group border border-white/5 bg-white/[0.02] hover:border-primary/40 transition-all cursor-pointer p-4"
                    onClick={() => {
                      setSelectedProduct(item.products);
                      // Don't close grid modal yet if user wants to browse multiple, 
                      // but ProductModal is higher z-index anyway.
                    }}
                  >
                    <div className="aspect-square mb-4 overflow-hidden bg-secondary relative">
                      {item.products.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                          <span className="text-[7px] tracking-[0.2em] text-white/80 border border-white/20 px-2 py-1">ESGOTADO</span>
                        </div>
                      )}
                      <img 
                        src={item.products.image_url.split(',')[0]} 
                        alt={item.products.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] tracking-[0.3em] text-muted-foreground block mb-1 uppercase">{item.products.category}</span>
                      <h3 className="text-xs tracking-widest group-hover:text-primary transition-colors">{item.products.name}</h3>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-[10px] tracking-widest text-primary">{formatPrice(item.products.price)}</p>
                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VoidViewIcon = () => (
  <div className="relative w-5 h-5 flex items-center justify-center">
    {/* Geometric crosshair style icon */}
    <div className="absolute inset-0 border border-current opacity-20" />
    <div className="w-1.5 h-1.5 bg-current" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1.5 bg-current" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-1.5 bg-current" />
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[1px] bg-current" />
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-[1px] bg-current" />
    
    {/* Scanning lines on hover handled via parent group-hover and CSS if needed, 
        but let's keep it clean SVG/Div based */}
    <motion.div 
      className="absolute inset-0 border-t border-primary/40"
      animate={{ top: ['0%', '100%', '0%'] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

export default Collection;
