import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X, ShoppingBag, Home, LayoutGrid, Package, TrendingUp, Info } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: "Home", path: "/", icon: <Home size={16} /> },
  { label: "Conjuntos", path: "/colecao", icon: <Package size={16} /> },
  { label: "Acessórios", path: "/acessorios", icon: <LayoutGrid size={16} /> },
  { label: "Em Alta", path: "/#trending", icon: <TrendingUp size={16} /> },
  { label: "Sobre", path: "/sobre", icon: <Info size={16} /> },
  { label: "Carrinho", path: "#", icon: <ShoppingBag size={16} /> },
];

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
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
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[80%] max-w-[400px] bg-background border-r border-white/5 z-[70] md:hidden overflow-hidden flex flex-col"
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
            <div className="relative z-10 flex items-center justify-between p-8">
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
            <nav className="relative z-10 flex-grow px-8 pt-12 flex flex-col gap-8">
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
                    className="group flex items-center gap-4 transition-all duration-300"
                  >
                    <span className="text-muted-foreground/30 group-hover:text-white transition-colors">
                      {item.icon}
                    </span>
                    <span className="font-display text-xl tracking-[0.3em] text-muted-foreground group-hover:text-foreground transition-all duration-300 group-hover:translate-x-2">
                      {item.label}
                    </span>
                    <div className="h-px flex-grow bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ml-4" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Footer Footer */}
            <div className="relative z-10 p-8 border-t border-white/5">
              <p className="font-display text-[8px] tracking-[0.5em] text-muted-foreground uppercase opacity-30 leading-loose">
                Void Drip Society <br />
                Codified Reality 2026
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
