import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { X, Home, LayoutGrid, Package, TrendingUp, Info, LogOut, User, Settings, ShoppingBag as OrdersIcon, Ticket } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Loja", path: "/", icon: <Home size={16} /> },
  { label: "Conjuntos", path: "/colecao", icon: <Package size={16} /> },
  { label: "Acessórios", path: "/acessorios", icon: <LayoutGrid size={16} /> },
  { label: "Em Alta", path: "/#trending", icon: <TrendingUp size={16} /> },
  { label: "Sobre", path: "/sobre", icon: <Info size={16} /> },
];

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate('/');
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 h-full h-[100dvh] w-[80%] max-w-[400px] bg-background border-l border-white/5 z-[70] md:hidden overflow-hidden flex flex-col"
          >
            {/* Cosmic Background Elements */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -left-20 w-64 h-64 border border-white/5 rounded-full" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-20 -right-20 w-80 h-80 border border-white/5 rounded-full" 
              />
              {/* Spacetime mesh lines */}
              <div className="absolute inset-0 opacity-5" style={{ 
                backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6">
              <span className="font-display text-xs tracking-[0.4em] text-foreground">
                VOID <span className="text-muted-foreground/50">DRIP</span>
              </span>
              <button 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="relative z-10 flex-grow px-6 pt-4 flex flex-col justify-center gap-4">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className="group flex items-center gap-4 py-2 transition-all duration-300"
                  >
                    <span className="text-muted-foreground/30 group-hover:text-primary transition-colors">
                      {item.icon}
                    </span>
                    <span className="font-display text-lg tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-all duration-300 group-hover:translate-x-1">
                      {item.label}
                    </span>
                    <div className="h-[1px] flex-1 bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ml-4" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Footer Footer */}
            <div className="relative z-10 p-6 border-t border-white/5 bg-black/40">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display text-[9px] tracking-[0.2em] text-white uppercase truncate max-w-[150px]">
                        {user.email?.split('@')[0]}
                      </span>
                      <Link to="/perfil" onClick={onClose} className="text-[10px] text-primary uppercase font-bold tracking-widest mt-0.5">
                        Ver Perfil
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      to="/pedidos" 
                      onClick={onClose}
                      className="flex flex-col items-center justify-center py-3 px-4 border border-white/5 bg-white/5 rounded-none hover:bg-white/10 transition-colors"
                    >
                      <OrdersIcon size={16} className="text-muted-foreground mb-1.5" />
                      <span className="font-display text-[7px] tracking-[0.2em] text-white uppercase text-center">Pedidos</span>
                    </Link>
                    <Link 
                      to="/cupons" 
                      onClick={onClose}
                      className="flex flex-col items-center justify-center py-3 px-4 border border-white/5 bg-white/5 rounded-none hover:bg-white/10 transition-colors"
                    >
                      <Ticket size={16} className="text-muted-foreground mb-1.5" />
                      <span className="font-display text-[7px] tracking-[0.2em] text-white uppercase text-center">Cupons</span>
                    </Link>
                  </div>

                  {user.email === "rauanrocha.martech@gmail.com" && (
                    <Link
                      to="/admin/cupons"
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-3 border border-primary/20 bg-primary/5 rounded-none"
                    >
                      <Ticket size={16} className="text-primary" />
                      <span className="font-display text-[9px] tracking-[0.2em] text-primary uppercase">Gerenciar Cupons</span>
                    </Link>
                  )}

                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-4 group w-full text-left mt-2"
                  >
                    <span className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-red-500/10 group-hover:border-red-500/40 transition-all duration-300 shadow-[0_0_20px_rgba(255,0,0,0.05)] group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                      <LogOut size={16} className="text-muted-foreground group-hover:text-red-400 transition-colors" />
                    </span>
                    <div className="flex flex-col">
                       <span className="font-display text-[10px] tracking-[0.3em] text-muted-foreground group-hover:text-white transition-colors uppercase">
                        Sair do Void
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <p className="font-display text-[8px] tracking-[0.5em] text-muted-foreground uppercase opacity-30 leading-loose">
                  Void Drip Society <br />
                  Codified Reality 2026
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
