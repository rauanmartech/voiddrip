import { motion, AnimatePresence, Variants } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, Clock, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

export const CartDrawer = () => {
  const { isCartOpen, toggleCart, items, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: allProducts = [] } = useProducts();
  const navigate = useNavigate();

  // Trava a rolagem da página
  useEffect(() => {
    if (isCartOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  // Urgency Timer
  const [timeLeft, setTimeLeft] = useState(45 * 60); 
  useEffect(() => {
    if (!isCartOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCartOpen]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Delivery Date Calculation
  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  // Free Shipping Calculation
  const FREE_SHIPPING_THRESHOLD = 300;
  const progress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - cartTotal;

  // Cross-selling (Suggest combinations based on cart items)
  const crossSellRecommendations = useMemo(() => {
    if (items.length === 0 || allProducts.length === 0) return [];
    
    // Pegamos a categoria do primeiro item
    const mainCategory = items[0].product.category;
    
    // Sugerir itens da mesma categoria ou acessórios
    const suggestions = allProducts.filter(p => !items.some(item => item.product.id === p.id));
    
    return suggestions.sort(() => 0.5 - Math.random()).slice(0, 2);
  }, [items, allProducts]);

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const drawerVariants: Variants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 300, damping: 30 } 
    },
    exit: { x: "100%", opacity: 0, transition: { ease: "easeInOut", duration: 0.3 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsCheckingOut(false);
        setIsAuthModalOpen(true);
        return;
      }

      // Usuário autenticado, prossegue
      setTimeout(() => {
        setIsCheckingOut(false);
        toggleCart();
        navigate('/checkout'); // Rota futura ou atual de checkout
      }, 500);

    } catch (error) {
      console.error(error);
      setIsCheckingOut(false);
    }
  };

  const onAuthSuccess = () => {
    setIsAuthModalOpen(false);
    toggleCart();
    navigate('/checkout'); // Segue o fluxo sem perder itens
  };

  const handleCrossSellRecomendation = (id: string) => {
    toggleCart();
    navigate(`/produto/${id}`);
  };

  return (
    <>
      <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={toggleCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
          />

          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-[#030303] border-l border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] z-[9999] flex flex-col overflow-hidden"
          >
            {/* Ambient Background Light */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none opacity-40 mix-blend-screen" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl relative z-10">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-white" />
                <h2 className="font-display text-base tracking-[0.2em] text-white uppercase mt-1">
                  SEU DRIP
                </h2>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black font-display text-[10px] ml-2">
                  {items.length}
                </span>
              </div>
              <button
                onClick={toggleCart}
                className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Urgency Bar - Dynamic Shipping Deadline */}
            {items.length > 0 && (
              <div className="bg-gradient-to-r from-red-600/20 to-orange-500/20 px-6 py-2.5 border-b border-white/5 flex items-center justify-center gap-2">
                <Clock size={12} className="text-red-400 animate-pulse" />
                <span className="font-display text-[9px] tracking-[0.2em] text-red-200 uppercase">
                  Finalize em <span className="text-white font-bold">{formatTime(timeLeft)}</span> para enviarmos HOJE
                </span>
              </div>
            )}

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01]">
                <div className="flex justify-between items-end mb-3">
                  <span className="font-display text-[9px] tracking-[0.2em] text-muted-foreground uppercase flex items-center gap-1.5">
                    <Truck size={12} className="text-primary" />
                    Frete Drip Especial
                  </span>
                  <span className="font-display text-[9px] tracking-[0.1em] text-white uppercase font-bold">
                    {progress >= 100 
                      ? "FRETE GRÁTIS DESBLOQUEADO 🎉" 
                      : `FALTA ${formatPrice(remaining)}`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-primary"
                  />
                </div>
              </div>
            )}

            {/* Content List */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
                  <div className="w-24 h-24 mb-6 relative">
                    <div className="absolute inset-0 border border-dashed border-white/20 rounded-full animate-spin-slow" />
                    <ShoppingBag size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40" strokeWidth={1} />
                  </div>
                  <p className="font-display text-[10px] tracking-[0.4em] text-white uppercase line-height-[1.8]">O VAZIO AGUARDA SEU ESTILO</p>
                  <button onClick={toggleCart} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 font-display text-[9px] tracking-[0.3em] hover:bg-white hover:text-black transition-all rounded-full uppercase">
                    EXPLORAR COLEÇÃO
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Items list */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div 
                          key={item.id} 
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          className="flex gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative transition-colors hover:border-white/10"
                        >
                          {/* Image */}
                          <div className="w-20 h-24 bg-black flex-shrink-0 border border-white/5 rounded-xl overflow-hidden relative">
                            {item.product.image_url && (
                              <img 
                                src={item.product.image_url.split(',')[0]} 
                                alt={item.product.name} 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex flex-col flex-1 justify-between py-1">
                            <div>
                              <div className="flex justify-between items-start gap-2 pr-1">
                                <h3 className="font-display text-[10px] tracking-[0.1em] text-white uppercase leading-snug line-clamp-2 pr-6">
                                  {item.product.name}
                                </h3>
                                {/* Trash positioned top right of the card cleanly */}
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/50 transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                {item.size && <span className="font-display text-[8px] tracking-[0.2em] border border-white/20 px-1.5 py-0.5 rounded uppercase">Tam: {item.size}</span>}
                                {item.color && <span className="font-display text-[8px] tracking-[0.2em] border border-white/20 px-1.5 py-0.5 rounded uppercase">{item.color}</span>}
                              </div>
                            </div>

                            <div className="flex items-end justify-between mt-3">
                              <span className="font-display text-[11px] tracking-widest text-primary font-bold">
                                {formatPrice(item.product.price)}
                              </span>
                              
                              {/* Quantity Selector - Intuitive +/- */}
                              <div className="flex items-center bg-white/5 border border-white/10 rounded-full h-8 px-1">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 rounded-full transition-colors active:scale-90"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="w-6 text-center font-display text-[10px] text-white">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 rounded-full transition-colors active:scale-90"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* CROSS-SELLING SECTION */}
                  {crossSellRecommendations.length > 0 && (
                    <div className="mt-12 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={12} className="text-primary" />
                        <h4 className="font-display text-[9px] tracking-[0.3em] text-white uppercase">Sugerido para você</h4>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                        {crossSellRecommendations.map(rec => (
                          <div key={rec.id} className="min-w-[200px] bg-white/[0.02] border border-white/5 rounded-2xl p-3 snap-start">
                            <div className="w-full aspect-square bg-black rounded-xl overflow-hidden mb-3 relative group">
                              {rec.image_url && <img src={rec.image_url.split(",")[0]} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={rec.name} />}
                              <button onClick={() => handleCrossSellRecomendation(rec.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="px-3 py-1.5 border border-white text-white font-display text-[8px] tracking-[0.2em] rounded-full uppercase bg-black/50 backdrop-blur-md">VER DETALHES</span>
                              </button>
                            </div>
                            <h5 className="font-display text-[9px] tracking-[0.1em] text-white uppercase line-clamp-1">{rec.name}</h5>
                            <p className="font-display text-[9px] tracking-widest text-primary mt-1">{formatPrice(rec.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with Checkout Actions */}
            {items.length > 0 && (
              <div className="p-6 bg-[#030303] border-t border-white/10 relative z-20">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Subtotal</span>
                    <span className="font-display text-[11px] tracking-wider text-white/80">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                    <span className="font-display text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Frete Estimado</span>
                    <span className="font-display text-[10px] tracking-wider text-primary uppercase font-bold">
                      {progress >= 100 ? "GRATUITO" : "A CALCULAR"}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <div className="flex flex-col">
                      <span className="font-display text-[11px] tracking-[0.2em] text-white uppercase">TOTAL</span>
                      <span className="font-body text-[9px] text-muted-foreground lowercase opacity-80">
                        estimativa entrega: {deliveryDate}
                      </span>
                    </div>
                    <span className="font-display text-xl tracking-wider text-white font-bold">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full relative group overflow-hidden bg-white text-black rounded-xl py-5 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="relative font-display text-[11px] tracking-[0.4em] font-bold uppercase z-10">
                    {isCheckingOut ? "INICIANDO CHECKOUT..." : "FINALIZAR COMPRA SEGURA"}
                  </span>
                  {!isCheckingOut && (
                    <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </div>
            )}
            
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <AuthModal 
      isOpen={isAuthModalOpen} 
      onClose={() => setIsAuthModalOpen(false)} 
      onSuccess={onAuthSuccess} 
    />
    </>
  );
};
