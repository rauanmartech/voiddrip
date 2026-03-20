import { useState, useEffect } from "react";
import { ShoppingBag, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import { usePrefetchProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";

const navLinks = [
  { label: "Loja", to: "/" },
  { label: "Conjuntos", to: "/colecao" },
  { label: "Acessórios", to: "/acessorios" },
  { label: "Sobre", to: "/sobre" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { prefetchProducts, prefetchTrending } = usePrefetchProducts();
  const { itemCount, toggleCart } = useCart();

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
            VOID DRIP SOCIETY
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
    </>
  );
};

export default Navbar;
