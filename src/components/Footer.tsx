import { Link } from "react-router-dom";

const footerLinks = ["Loja", "Coleções", "Sobre", "Contato"];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <span className="font-display text-sm tracking-[0.3em] text-foreground">
            VOID DRIP SOCIETY
          </span>
          <div className="flex gap-6">
            {footerLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="font-display text-[9px] tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase"
              >
                {link}
              </a>
            ))}
            <Link
              to="/admin"
              className="font-display text-[9px] tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors duration-300 uppercase"
            >
              ADM
            </Link>
          </div>
          {/* Social icons as minimal circles */}
          <div className="flex gap-3">
            {["IG", "TW", "TK"].map((s) => (
              <div
                key={s}
                className="w-8 h-8 border border-border flex items-center justify-center text-[8px] font-display tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-all duration-300 cursor-pointer"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 text-center">
          <p className="font-body text-[10px] text-muted-foreground tracking-wider">
            © 2026 VOID DRIP SOCIETY. TODOS OS DIREITOS RESERVADOS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
