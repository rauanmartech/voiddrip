import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, User, ShoppingBag, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "login" | "checkout";
}

export const AuthModal = ({ isOpen, onClose, onSuccess, mode = "login" }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forms
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const redirectPath = mode === "checkout" ? "/checkout" : window.location.pathname;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`
        }
      });
      if (error) throw error;
      // Note: With OAuth, the page will redirect, so no need to call onSuccess here
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar com Google");
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres");
      return;
    }

    try {
      setIsLoading(true);
      if (isLogin) {
        // Login Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Acesso autorizado!");
        onSuccess();
      } else {
        // Register Flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone: phone || undefined,
            }
          }
        });
        if (error) throw error;
        toast.success("Conta criada! Redirecionando...");
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    // Continue sem criar conta
    toast.info("Acessando como convidado...");
    onSuccess();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Escuro com Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[10000]"
          />

          {/* Modal Central */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-4xl bg-background border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col md:flex-row overflow-hidden max-h-[95vh] md:max-h-none overflow-y-auto md:overflow-visible"
            >
              
              {/* Left Column: Form / Social */}
              <div className="flex-1 p-8 md:p-12 relative flex flex-col justify-center">
                <button 
                  onClick={onClose}
                  className="absolute top-6 right-6 md:hidden w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/50"
                >
                  <X size={16} />
                </button>

                <div className="mb-10 text-center md:text-left">
                  <h2 className="font-display text-2xl md:text-3xl text-white tracking-[0.1em] uppercase mb-2">
                    {isLogin ? "Acessar o Void" : "Criar sua Conta"}
                  </h2>
                  <p className="font-body text-xs md:text-sm text-muted-foreground">
                    Conecte-se para um checkout mais rápido e acesse seus pedidos.
                  </p>
                </div>

                {/* Social Login Prominente */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black hover:bg-gray-200 transition-colors border border-transparent hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-8 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase">
                    Continuar com Google
                  </span>
                </button>

                <div className="relative flex items-center mb-8">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 font-display text-[9px] tracking-[0.3em] text-muted-foreground uppercase">
                    Ou Use Seu Email
                  </span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 px-4 py-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="Senha (mín. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      className="w-full bg-[#050505] border border-white/10 px-4 py-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  
                  {/* Somente em registro mostramos campo de telefone opcional para UX inteligente */}
                  {!isLogin && (
                    <div>
                      <input
                        type="tel"
                        placeholder="WhatsApp (Opcional)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 px-4 py-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-white/30 transition-colors mb-2"
                      />
                      <div className="flex gap-2 items-start text-white/40">
                        <Info size={12} className="flex-shrink-0 mt-0.5" />
                        <span className="font-body text-[10px] leading-tight">
                          Sem spam. Usado exclusivamente para atualizações sobre sua entrega via WhatsApp.
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-neon-green py-5 mt-2 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 font-bold"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : isLogin ? "ENTRAR NO DRIP" : "CRIAR CONTA"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    type="button" 
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-display text-[9px] tracking-[0.1em] text-primary/80 hover:text-primary transition-colors uppercase underline underline-offset-4"
                  >
                    {isLogin ? "NÃO POSSUI CONTA? CRIE AGORA" : "JÁ POSSUI CONTA? FAÇA LOGIN"}
                  </button>
                </div>
              </div>

              {/* Right Column: Guest Checkout */}
              <div className="flex-1 bg-[#050505] border-t md:border-t-0 md:border-l border-white/5 p-8 md:p-12 relative flex flex-col justify-center">
                <button 
                  onClick={onClose}
                  className="hidden md:flex absolute top-6 right-6 w-10 h-10 items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 z-10"
                >
                  <X size={18} />
                </button>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag size={24} className="text-white/70" />
                  </div>
                  <h3 className="font-display text-xl md:text-2xl text-white tracking-[0.1em] uppercase mb-4">
                    Comprar Deslogado
                  </h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm">
                    Não se preocupe em criar senhas se não quiser. 
                    Cuidamos do seu checkout super rápido de forma anônima e 100% segura.
                  </p>

                  <button
                    onClick={handleGuestCheckout}
                    className="w-full relative group overflow-hidden border border-white bg-transparent text-white py-5 flex items-center justify-center gap-2 md:gap-3 transition-colors hover:bg-white hover:text-black"
                  >
                    <span className="relative font-display text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.3em] font-bold uppercase z-10">
                      CONTINUAR COMO CONVIDADO
                    </span>
                    <ArrowRight size={14} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
                
                {/* Visual Flair */}
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
              </div>
              
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
