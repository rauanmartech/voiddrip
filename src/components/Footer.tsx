import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  
  // Lista de e-mails administrativos autorizados
  const ADMIN_EMAILS = ["rauanrocha.martech@gmail.com", "rauan.martech@gmail.com"];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const footerNav = [
    { label: "Loja", to: "/" },
    { label: "Coleções", to: "/colecao" },
    { label: "Sobre", to: "/sobre" },
    { label: "Contato", to: "https://wa.me/5571983789492", isExternal: true },
  ];

  return (
    <footer className="border-t border-white/5 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-display text-sm tracking-[0.4em] text-foreground">
              VOID DRIP SOCIETY
            </span>
            <p className="text-[8px] tracking-[0.3em] text-muted-foreground uppercase opacity-50">
              Architecting the Future of Streetwear
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {footerNav.map((link) => (
              link.isExternal ? (
                <a
                  key={link.label}
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-[9px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-all duration-300 uppercase"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="font-display text-[9px] tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all duration-300 uppercase"
                >
                  {link.label}
                </Link>
              )
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className="font-display text-[9px] tracking-[0.3em] text-primary border-b border-primary/20 pb-0.5 hover:border-primary transition-all duration-300 uppercase"
              >
                ADM
              </Link>
            )}
          </div>

          <div className="flex gap-4">
            {["IG", "TW", "TK"].map((s) => (
              <div
                key={s}
                className="w-10 h-10 border border-white/5 flex items-center justify-center text-[8px] font-display tracking-widest text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-500 cursor-pointer bg-white/[0.02] backdrop-blur-sm"
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-[9px] text-muted-foreground tracking-[0.2em] uppercase opacity-40">
            © 2026 VOID DRIP SOCIETY. TODOS OS DIREITOS RESERVADOS.
          </p>
          <div className="flex gap-6 text-[8px] tracking-widest text-muted-foreground/30 uppercase">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
