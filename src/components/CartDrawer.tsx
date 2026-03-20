import { motion, AnimatePresence, Variants } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
};

export const CartDrawer = () => {
  const { isCartOpen, toggleCart, items, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Trava a rolagem da página quando o carrinho estiver aberto
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Animação do overlay
  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  // Animação do painel lateral (Drawer)
  const drawerVariants: Variants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { type: "spring", stiffness: 350, damping: 30, mass: 1 } 
    },
    exit: { 
      x: "100%", 
      opacity: 0, 
      transition: { ease: "easeInOut", duration: 0.3 } 
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Simulating an API call or modal open for authentication step
    setTimeout(() => {
      setIsCheckingOut(false);
      alert("MOCK: Abrir modal de Login ou Criação de Conta.");
      // Here you would hook into the real auth flow
    }, 800);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay Escuro com Blur */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={toggleCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer Principal */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-background border-l border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[9999] flex flex-col"
          >
            {/* Header do Drawer */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#090909]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-display text-lg tracking-[0.2em] text-foreground uppercase">
                  SEU DRIP
                </h2>
              </div>
              <button
                onClick={toggleCart}
                className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista de Produtos no Carrinho */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag size={48} className="mb-4 text-white/20" strokeWidth={1} />
                  <p className="font-display text-xs tracking-[0.3em] uppercase">O Vazio aguarda</p>
                  <p className="font-body text-xs text-muted-foreground mt-2">Nenhum artefato no seu carrinho ainda.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="group flex gap-4 bg-white/[0.02] border border-white/5 p-4 relative overflow-hidden transition-colors hover:border-white/20 hover:bg-white/5">
                    {/* Imagem do Produto */}
                    <div className="w-20 h-24 bg-black flex-shrink-0 border border-white/10 overflow-hidden relative">
                      {item.product.image_url ? (
                        <img 
                          src={item.product.image_url.split(',')[0]} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5" />
                      )}
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-display text-[11px] tracking-[0.1em] text-foreground uppercase leading-tight line-clamp-2">
                            {item.product.name}
                          </h3>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-white/30 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Selected Variants */}
                        <div className="flex items-center gap-3 mt-1.5 opacity-60">
                          {item.size && (
                            <span className="font-display text-[8px] tracking-[0.2em] uppercase">
                              Tam: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="font-display text-[8px] tracking-[0.2em] uppercase">
                                Cor: {item.color}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Controle de Preço e Quantidade */}
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-display text-xs tracking-widest text-primary">
                          {formatPrice(item.product.price)}
                        </span>
                        
                        {/* Seletor de Quantidade Futurista */}
                        <div className="flex items-center border border-white/10 bg-black">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-display text-[10px] text-white">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer do Drawer (Subtotal e Finalizar) */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#060606] relative z-10">
                <div className="flex justify-between items-end mb-6">
                  <span className="font-display text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                    Subtotal
                  </span>
                  <span className="font-display text-xl tracking-wider text-white">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                
                <p className="font-body text-[10px] text-muted-foreground text-center mb-6">
                  Taxas e frete calculados no próximo passo.
                </p>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full relative group overflow-hidden border border-primary bg-primary text-primary-foreground py-4 flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative font-display text-[11px] tracking-[0.5em] font-bold uppercase z-10">
                    {isCheckingOut ? "PROCESSANDO..." : "FINALIZAR COMPRA"}
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
  );
};
