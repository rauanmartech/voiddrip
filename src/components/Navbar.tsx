import { useState, useEffect } from "react";
import { ShoppingBag, Menu, User, LogOut, Settings, LayoutDashboard, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import { usePrefetchProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { AuthModal } from "./AuthModal";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Loja", to: "/" },
  { label: "Conjuntos", to: "/colecao" },
  { label: "Acessórios", to: "/acessorios" },
  { label: "Sobre", to: "/sobre" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const { prefetchProducts, prefetchTrending } = usePrefetchProducts();
  const { itemCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prefetch products when hovering nav links that will show them
  const handleLinkHover = (to: string) => {
    if (to === "/" || to === "/colecao") {
      prefetchProducts();
      prefetchTrending();
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-nav" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between py-5 px-6">
          <Link to="/" className="font-display text-sm tracking-[0.3em] text-foreground">
            VOID DRIP
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onMouseEnter={() => handleLinkHover(link.to)}
                className="font-display text-[10px] tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase"
              >
                {link.label}
              </Link>
            ))}

            {/* Auth section */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:border-primary/50 transition-colors overflow-hidden">
                      {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} className="text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-56 bg-background/95 backdrop-blur-xl border border-white/10 p-2 z-[60] shadow-2xl"
                      >
                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                          <p className="font-display text-[9px] text-muted-foreground tracking-widest uppercase mb-1">Logado como</p>
                          <p className="text-[10px] text-white truncate font-body">{user.email}</p>
                        </div>
                        
                        <Link to="/perfil" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group">
                          <Settings size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="font-display text-[9px] tracking-[0.2em] text-white uppercase">Minha Conta</span>
                        </Link>

                        <button 
                          onClick={async () => {
                            await signOut();
                            setIsProfileOpen(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors group text-left"
                        >
                          <LogOut size={14} className="text-muted-foreground group-hover:text-red-400 transition-colors" />
                          <span className="font-display text-[9px] tracking-[0.2em] text-white uppercase">Sair do Void</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="btn-neon-green"
                >
                  Entrar
                </button>
              )}
            </div>

            <Link 
              to="/favoritos"
              className="relative text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <Heart size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#FF1CF7] text-white text-[9px] font-bold font-display w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in shadow-[0_0_10px_rgba(255,28,247,0.5)]">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button 
              onClick={toggleCart}
              className="relative text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-black text-[9px] font-bold font-display w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-6">
            {!user && (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-[#00FF87]/20 bg-[#00FF87]/5 text-[#00FF87] shadow-[0_0_15px_rgba(0,255,135,0.2)] active:scale-90 transition-all"
              >
                <User size={16} strokeWidth={2} />
              </button>
            )}
            <Link 
              to="/favoritos"
              className="relative text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <Heart size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#FF1CF7] text-white text-[9px] font-bold font-display w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in shadow-[0_0_10px_rgba(255,28,247,0.5)]">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button 
              onClick={toggleCart}
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-black text-[9px] font-bold font-display w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // O hook useAuth atualizará automaticamente o Navbar
        }}
      />
    </>
  );
};

export default Navbar;
